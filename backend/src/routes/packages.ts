import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CorreiosPDFParser, isValidTrackingCode, cleanRecipientName } from '../utils/pdfParser';
import { cleanExpiredCache, getCacheStats } from '../utils/pdfCache';

const router = Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/pdfs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Cleanup temp files older than 24 hours
async function cleanupTempFiles(): Promise<void> {
  try {
    const uploadDir = path.join(__dirname, '../../uploads/pdfs');
    if (!fs.existsSync(uploadDir)) return;
    
    const files = fs.readdirSync(uploadDir);
    const now = Date.now();
    let cleaned = 0;
    
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;
      
      // Remove files older than 24 hours
      if (age > 24 * 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} arquivo(s) temporário(s) removido(s)`);
    }
  } catch (error) {
    console.error('❌ Erro ao limpar arquivos temporários:', error);
  }
}

// Run cleanup on startup and every 6 hours
cleanupTempFiles();
cleanExpiredCache();
setInterval(() => {
  cleanupTempFiles();
  cleanExpiredCache();
}, 6 * 60 * 60 * 1000);

// Public: Get packages (for public consultation)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    
    let queryText = 'SELECT * FROM packages WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      queryText += ` AND (LOWER(recipient_name) LIKE LOWER($${paramIndex}) OR LOWER(tracking_code) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status && status !== 'ALL') {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    queryText += ' ORDER BY arrival_date DESC';

    const result = await query(queryText, params);
    
    // Calculate remaining days for each package
    const packages = result.rows.map(pkg => {
      const today = new Date();
      const deadline = new Date(pkg.pickup_deadline);
      const diffTime = deadline.getTime() - today.getTime();
      const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...pkg,
        diasRestantes: diasRestantes > 0 ? diasRestantes : 0
      };
    });

    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Error fetching packages' });
  }
});

// Admin: Get all packages
router.get('/admin/all', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT * FROM packages 
      ORDER BY 
        CASE status 
          WHEN 'aguardando' THEN 1 
          WHEN 'entregue' THEN 2 
          WHEN 'devolvido' THEN 3 
        END,
        arrival_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Error fetching packages' });
  }
});

// Admin: Get package stats
router.get('/admin/stats', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'aguardando') as aguardando,
        COUNT(*) FILTER (WHERE status = 'entregue') as entregue,
        COUNT(*) FILTER (WHERE status = 'devolvido') as devolvido
      FROM packages
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// Admin: Get cache statistics
router.get('/admin/cache-stats', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({ error: 'Error fetching cache stats' });
  }
});

// Admin: Upload PDF and extract packages (returns preview for confirmation)
router.post('/upload-pdf', authenticateToken, upload.single('pdf'), async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      res.status(400).json({ 
        success: false,
        error: 'Nenhum arquivo PDF enviado' 
      });
      return;
    }

    console.log(`📄 Upload recebido: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
    
    // Use the robust parser
    const parser = new CorreiosPDFParser({
      enableCache: true,
      enableLogging: true
    });
    
    const parseResult = await parser.parse(req.file.path);
    
    // Transform to API response format
    const response = {
      success: parseResult.success,
      results: {
        packages: parseResult.packages.map(pkg => ({
          recipient_name: pkg.recipient,
          tracking_code: pkg.trackingCode,
          arrival_date: pkg.dateISO,
          position: pkg.position,
          confidence: pkg.confidence,
          lineNumber: pkg.lineNumber
        })),
        filename: req.file.filename,
        autoExtracted: parseResult.success
      },
      metadata: parseResult.metadata,
      errors: parseResult.errors,
      warnings: parseResult.warnings,
      message: parseResult.success
        ? `${parseResult.totalPackages} encomenda(s) extraída(s) automaticamente usando ${parseResult.metadata.strategy}. Revise os dados antes de confirmar.`
        : `Não foi possível extrair dados: ${parseResult.errors.join(', ')}`,
      processingTime: Date.now() - startTime
    };

    res.json(response);
    
  } catch (error: any) {
    console.error('❌ Erro no upload de PDF:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao processar PDF',
      details: error.message,
      processingTime: Date.now() - startTime
    });
  }
});

// Admin: Upload LDI list (alias for upload-pdf with enhanced response)
router.post('/upload-lista', authenticateToken, upload.single('pdf'), async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      res.status(400).json({ 
        success: false,
        error: 'Nenhum arquivo PDF enviado' 
      });
      return;
    }

    console.log(`📄 Upload LDI: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
    
    const parser = new CorreiosPDFParser({
      enableCache: true,
      enableLogging: true
    });
    
    const parseResult = await parser.parse(req.file.path);
    
    // Enhanced response format as specified
    const response = {
      success: parseResult.success,
      totalPackages: parseResult.totalPackages,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        processingTime: parseResult.metadata.processingTime,
        strategy: parseResult.metadata.strategy,
        uploadedAt: new Date().toISOString(),
        expectedTotal: parseResult.metadata.expectedTotal,
        extractedTotal: parseResult.metadata.extractedTotal,
        pagesProcessed: parseResult.metadata.pagesProcessed
      },
      packages: parseResult.packages.map(pkg => ({
        lineNumber: pkg.lineNumber,
        trackingCode: pkg.trackingCode,
        recipient: pkg.recipient,
        position: pkg.position,
        date: pkg.date,
        dateISO: pkg.dateISO,
        confidence: pkg.confidence
      })),
      errors: parseResult.errors,
      warnings: parseResult.warnings
    };

    res.json(response);
    
  } catch (error: any) {
    console.error('❌ Erro no upload LDI:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao processar PDF',
      details: error.message
    });
  }
});

// Admin: Confirm import of extracted packages
router.post('/confirm-import', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    // Accept both pdfFilename and pdf_filename for compatibility
    const { packages: packagesToImport, pdfFilename, pdf_filename } = req.body;
    const filename = pdfFilename || pdf_filename;

    if (!packagesToImport || !Array.isArray(packagesToImport) || packagesToImport.length === 0) {
      res.status(400).json({ error: 'No packages to import' });
      return;
    }

    const results = {
      imported: 0,
      duplicates: 0,
      errors: 0,
      details: [] as any[]
    };

    for (const pkg of packagesToImport) {
      try {
        // Support both formats (from upload-pdf and upload-lista)
        const recipientName = pkg.recipient_name || pkg.recipient;
        const trackingCode = pkg.tracking_code || pkg.trackingCode;
        const arrivalDateStr = pkg.arrival_date || pkg.dateISO;
        const pickupDeadlineStr = pkg.pickup_deadline;
        
        // Debug: log received dates
        console.log('📦 Package import - Datas recebidas:', {
          trackingCode,
          recipientName,
          arrivalDateStr,
          pickupDeadlineStr,
          rawPkg: pkg
        });
        
        // Validate required fields
        if (!recipientName || !trackingCode) {
          results.errors++;
          results.details.push({ 
            tracking_code: trackingCode || 'N/A', 
            status: 'error', 
            reason: 'Campos obrigatórios faltando' 
          });
          continue;
        }

        // Validate tracking code format
        if (!isValidTrackingCode(trackingCode)) {
          results.errors++;
          results.details.push({ 
            tracking_code: trackingCode, 
            status: 'error', 
            reason: 'Formato de código inválido' 
          });
          continue;
        }

        // Check if tracking code already exists
        const existing = await query(
          'SELECT id FROM packages WHERE tracking_code = $1',
          [trackingCode]
        );

        if (existing.rows.length > 0) {
          results.duplicates++;
          results.details.push({ tracking_code: trackingCode, status: 'duplicate' });
          continue;
        }

        // Use arrival date from frontend or default to today
        const arrivalDate = arrivalDateStr ? new Date(arrivalDateStr + 'T12:00:00') : new Date();
        
        // Use pickup deadline from frontend or calculate 7 days from arrival
        let pickupDeadline: Date;
        if (pickupDeadlineStr) {
          pickupDeadline = new Date(pickupDeadlineStr + 'T12:00:00');
        } else {
          pickupDeadline = new Date(arrivalDate);
          pickupDeadline.setDate(pickupDeadline.getDate() + 7);
        }

        await query(
          `INSERT INTO packages (recipient_name, tracking_code, status, arrival_date, pickup_deadline, pdf_source)
           VALUES ($1, $2, 'aguardando', $3, $4, $5)`,
          [
            cleanRecipientName(recipientName), 
            trackingCode.toUpperCase(), 
            arrivalDate.toISOString().split('T')[0], 
            pickupDeadline.toISOString().split('T')[0], 
            filename || null
          ]
        );

        results.imported++;
        results.details.push({ tracking_code: trackingCode, status: 'imported' });
      } catch (err: any) {
        results.errors++;
        results.details.push({ 
          tracking_code: pkg.tracking_code || pkg.trackingCode, 
          status: 'error', 
          reason: err.message 
        });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error importing packages:', error);
    res.status(500).json({ error: 'Error importing packages' });
  }
});

// Admin: Create package manually
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipient_name, tracking_code, arrival_date, notes } = req.body;

    // Validate tracking code
    if (!isValidTrackingCode(tracking_code)) {
      res.status(400).json({ error: 'Código de rastreio inválido. Use o formato: XX000000000XX' });
      return;
    }

    // Calculate pickup deadline (7 days from arrival)
    const arrivalDate = new Date(arrival_date);
    const pickupDeadline = new Date(arrivalDate);
    pickupDeadline.setDate(pickupDeadline.getDate() + 7);

    const result = await query(
      `INSERT INTO packages (recipient_name, tracking_code, status, arrival_date, pickup_deadline, notes)
       VALUES ($1, $2, 'aguardando', $3, $4, $5)
       RETURNING *`,
      [cleanRecipientName(recipient_name), tracking_code.toUpperCase(), arrival_date, pickupDeadline, notes]
    );

    res.json({ success: true, package: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Tracking code already exists' });
    } else {
      console.error('Error creating package:', error);
      res.status(500).json({ error: 'Error creating package' });
    }
  }
});

// Admin: Update package (all fields)
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes, recipient_name, tracking_code, arrival_date, pickup_deadline } = req.body;

    // Parse dates properly - handle both ISO strings and date-only strings
    const parseDate = (dateStr: string | undefined): string | null => {
      if (!dateStr) return null;
      // If it's just a date string (YYYY-MM-DD), use it directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      // If it's an ISO string, extract the date part
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr;
    };

    const parsedArrivalDate = parseDate(arrival_date);
    const parsedPickupDeadline = parseDate(pickup_deadline);

    console.log('📦 Atualizando encomenda:', { id, arrival_date, pickup_deadline, parsedArrivalDate, parsedPickupDeadline });

    const result = await query(
      `UPDATE packages 
       SET status = COALESCE($1, status),
           notes = COALESCE($2, notes),
           recipient_name = COALESCE($3, recipient_name),
           tracking_code = COALESCE($4, tracking_code),
           arrival_date = COALESCE($5::date, arrival_date),
           pickup_deadline = COALESCE($6::date, pickup_deadline),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [status, notes, recipient_name, tracking_code, parsedArrivalDate, parsedPickupDeadline, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }

    res.json({ success: true, package: result.rows[0] });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Error updating package' });
  }
});

// Admin: Delete package
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM packages WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Error deleting package' });
  }
});

// Admin: Clear expired PDF cache
router.post('/admin/clear-cache', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const cleaned = await cleanExpiredCache();
    res.json({ success: true, cleaned });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Error clearing cache' });
  }
});

// Admin: Clear ALL PDF cache (force reprocessing)
router.post('/admin/clear-all-cache', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query('DELETE FROM pdf_cache RETURNING id');
    const deleted = result.rowCount || 0;
    console.log(`🧹 Cache completo limpo: ${deleted} entradas removidas`);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Error clearing all cache:', error);
    res.status(500).json({ error: 'Error clearing all cache' });
  }
});

export default router;
