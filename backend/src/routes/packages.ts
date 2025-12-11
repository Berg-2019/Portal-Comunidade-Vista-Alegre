import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

<<<<<<< HEAD
// Import pdf-parse with dynamic import for better compatibility
let pdfParse: any = null;

(async () => {
  try {
    const mod = await import('pdf-parse');
    pdfParse = (mod as any).default || mod;
    console.log('pdf-parse carregado, tipo:', typeof pdfParse);
  } catch (e) {
    console.warn('pdf-parse not available, PDF extraction will be disabled', e);
=======
// Carregador sob demanda do pdf-parse para melhor compatibilidade
let pdfParser: any = null;

async function loadPdfParser(): Promise<any> {
  if (pdfParser) return pdfParser;
  
  try {
    const module = await import('pdf-parse');
    // pdf-parse exporta a função diretamente, não como .default
    pdfParser = typeof module === 'function' ? module : (module.default || module);
    console.log('✅ pdf-parse carregado com sucesso');
    return pdfParser;
  } catch (error) {
    console.error('❌ Erro ao carregar pdf-parse:', error);
    return null;
>>>>>>> 943381ff21945e96d84a1190c665dea3790dee8a
  }
}



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

// PDF Extraction patterns
const TRACKING_CODE_REGEX = /[A-Z]{2}\d{9}[A-Z]{2}/g;
const DATE_REGEX = /(\d{2}\/\d{2}\/\d{4})/g;
const NAME_REGEX = /^[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ][A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ\s]{2,50}$/gm;

interface ExtractedPackage {
  recipient_name: string;
  tracking_code: string;
  arrival_date: string;
  confidence: number;
}

// Extract packages from PDF text
function extractPackagesFromText(text: string): ExtractedPackage[] {
  const packages: ExtractedPackage[] = [];
  
  // Find all tracking codes
  const trackingCodes = text.match(TRACKING_CODE_REGEX) || [];
  
  // Find all dates
  const dates = text.match(DATE_REGEX) || [];
  
  // Find potential names (lines in uppercase with 3-50 chars)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const names: string[] = [];
  
  for (const line of lines) {
    // Check if line looks like a name (uppercase, reasonable length, no numbers)
    if (/^[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ][A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ\s]{2,50}$/.test(line) && 
        !/\d/.test(line) &&
        !line.includes('CORREIOS') &&
        !line.includes('SEDEX') &&
        !line.includes('PAC') &&
        !line.includes('LISTA') &&
        !line.includes('ENCOMENDA')) {
      names.push(line);
    }
  }
  
  // Try to match tracking codes with names and dates
  // Strategy: For each tracking code, find the nearest name before it in the text
  for (let i = 0; i < trackingCodes.length; i++) {
    const trackingCode = trackingCodes[i];
    const codeIndex = text.indexOf(trackingCode);
    
    // Find the nearest name before this tracking code
    let nearestName = '';
    let nameDistance = Infinity;
    
    for (const name of names) {
      const nameIndex = text.indexOf(name);
      if (nameIndex < codeIndex && nameIndex !== -1) {
        const distance = codeIndex - nameIndex;
        if (distance < nameDistance) {
          nameDistance = distance;
          nearestName = name;
        }
      }
    }
    
    // Use today's date if no date found near the code
    let arrivalDate = new Date().toISOString().split('T')[0];
    
    // Try to find a date near the tracking code
    for (const date of dates) {
      const dateIndex = text.indexOf(date);
      if (Math.abs(dateIndex - codeIndex) < 100) {
        // Convert DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = date.split('/');
        arrivalDate = `${year}-${month}-${day}`;
        break;
      }
    }
    
    // Calculate confidence based on whether we found all fields
    let confidence = 0.33; // Base confidence for having tracking code
    if (nearestName) confidence += 0.33;
    if (arrivalDate !== new Date().toISOString().split('T')[0]) confidence += 0.34;
    
    packages.push({
      recipient_name: nearestName || 'NOME NÃO IDENTIFICADO',
      tracking_code: trackingCode,
      arrival_date: arrivalDate,
      confidence: Math.round(confidence * 100)
    });
  }
  
  // Remove duplicates by tracking code
  const uniquePackages = packages.filter((pkg, index, self) =>
    index === self.findIndex(p => p.tracking_code === pkg.tracking_code)
  );
  
  return uniquePackages;
}

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

// Admin: Upload PDF and extract packages (returns preview for confirmation)
router.post('/upload-pdf', authenticateToken, upload.single('pdf'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded' });
      return;
    }

    let extractedPackages: ExtractedPackage[] = [];
    let autoExtracted = false;

    // Carregar pdf-parse sob demanda
    const parser = await loadPdfParser();
    
    if (parser) {
      try {
        const pdfBuffer = fs.readFileSync(req.file.path);
        console.log('📄 Lendo PDF, tamanho:', pdfBuffer.length, 'bytes');
        
        const pdfData = await parser(pdfBuffer);
        console.log('📄 Texto extraído (primeiros 500 chars):', pdfData.text.substring(0, 500));
        
        extractedPackages = extractPackagesFromText(pdfData.text);
        autoExtracted = extractedPackages.length > 0;
        console.log(`📦 ${extractedPackages.length} encomenda(s) extraída(s) do PDF`);
      } catch (parseError) {
        console.error('❌ Erro ao parsear PDF:', parseError);
      }
    } else {
      console.warn('⚠️ pdf-parse não disponível');
    }

    // If no automatic extraction, try to use manual data if provided
    if (extractedPackages.length === 0 && req.body.packages) {
      try {
        extractedPackages = JSON.parse(req.body.packages);
      } catch (e) {
        // Ignore parse errors
      }
    }

    res.json({
      success: true,
      results: {
        packages: extractedPackages,
        filename: req.file.filename,
        autoExtracted
      },
      message: autoExtracted 
        ? `${extractedPackages.length} encomenda(s) extraída(s) automaticamente. Revise os dados antes de confirmar.`
        : 'Não foi possível extrair dados automaticamente. Adicione manualmente ou tente outro PDF.'
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Error processing PDF' });
  }
});

// Admin: Confirm import of extracted packages
router.post('/confirm-import', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { packages: packagesToImport, pdfFilename } = req.body;

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
        // Validate required fields
        if (!pkg.recipient_name || !pkg.tracking_code) {
          results.errors++;
          results.details.push({ tracking_code: pkg.tracking_code || 'N/A', status: 'error', reason: 'Campos obrigatórios faltando' });
          continue;
        }

        // Check if tracking code already exists
        const existing = await query(
          'SELECT id FROM packages WHERE tracking_code = $1',
          [pkg.tracking_code]
        );

        if (existing.rows.length > 0) {
          results.duplicates++;
          results.details.push({ tracking_code: pkg.tracking_code, status: 'duplicate' });
          continue;
        }

        // Calculate pickup deadline (7 days from arrival)
        const arrivalDate = new Date(pkg.arrival_date || new Date());
        const pickupDeadline = new Date(arrivalDate);
        pickupDeadline.setDate(pickupDeadline.getDate() + 7);

        await query(
          `INSERT INTO packages (recipient_name, tracking_code, status, arrival_date, pickup_deadline, pdf_source)
           VALUES ($1, $2, 'aguardando', $3, $4, $5)`,
          [pkg.recipient_name, pkg.tracking_code, arrivalDate.toISOString().split('T')[0], pickupDeadline, pdfFilename || null]
        );

        results.imported++;
        results.details.push({ tracking_code: pkg.tracking_code, status: 'imported' });
      } catch (err: any) {
        results.errors++;
        results.details.push({ tracking_code: pkg.tracking_code, status: 'error', reason: err.message });
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

    // Calculate pickup deadline (7 days from arrival)
    const arrivalDate = new Date(arrival_date);
    const pickupDeadline = new Date(arrivalDate);
    pickupDeadline.setDate(pickupDeadline.getDate() + 7);

    const result = await query(
      `INSERT INTO packages (recipient_name, tracking_code, status, arrival_date, pickup_deadline, notes)
       VALUES ($1, $2, 'aguardando', $3, $4, $5)
       RETURNING *`,
      [recipient_name, tracking_code, arrival_date, pickupDeadline, notes]
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

// Admin: Update package status
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const result = await query(
      `UPDATE packages 
       SET status = COALESCE($1, status),
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, notes, id]
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

export default router;