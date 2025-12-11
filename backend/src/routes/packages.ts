import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Carregador sob demanda do pdf-parse para melhor compatibilidade
let pdfParser: any = null;

async function loadPdfParser(): Promise<any> {
  if (pdfParser) return pdfParser;
  
  try {
    const module: any = await import('pdf-parse');
    
    // Debug: ver estrutura do módulo
    console.log('🔍 pdf-parse module keys:', Object.keys(module));
    console.log('🔍 typeof module.default:', typeof module.default);
    
    // Tratamento para duplo default (CommonJS + esModuleInterop + dynamic import)
    if (typeof module === 'function') {
      pdfParser = module;
    } else if (typeof module.default === 'function') {
      pdfParser = module.default;
    } else if (module.default && typeof module.default.default === 'function') {
      // Duplo default: acontece com esModuleInterop + dynamic import em alguns builds
      pdfParser = module.default.default;
    } else {
      // Fallback: tentar usar o próprio módulo
      pdfParser = module;
    }
    
    console.log('✅ pdf-parse carregado, tipo:', typeof pdfParser);
    return pdfParser;
  } catch (error) {
    console.error('❌ Erro ao carregar pdf-parse:', error);
    return null;
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

// PDF Extraction patterns - Brazilian tracking codes
const TRACKING_CODE_REGEX = /[A-Z]{2}\d{9}[A-Z]{2}/g;

interface ExtractedPackage {
  recipient_name: string;
  tracking_code: string;
  arrival_date: string;
  confidence: number;
}

// Sanitize recipient name
function sanitizeRecipientName(name: string): string {
  return name
    .replace(/[<>\"'&;]/g, '') // Remove potentially dangerous characters
    .replace(/:\s*$/, '') // Remove trailing colon
    .trim()
    .substring(0, 100); // Limit length
}

// Validate Brazilian tracking code format
function isValidTrackingCode(code: string): boolean {
  return /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(code);
}

// Extract packages from PDF text - Formato LDI Correios
function extractPackagesFromText(text: string): ExtractedPackage[] {
  const packages: ExtractedPackage[] = [];
  
  console.log('📄 Texto do PDF (primeiros 1000 chars):', text.substring(0, 1000));
  
  // Extrair data de devolução do cabeçalho (usada como referência de data)
  const returnDateMatch = text.match(/Data de Devolução:\s*(\d{2}\/\d{2}\/\d{4})/);
  const returnDate = returnDateMatch ? returnDateMatch[1] : null;
  console.log('📅 Data de Devolução encontrada:', returnDate);
  
  // Extrair total esperado de objetos
  const totalMatch = text.match(/Total de objetos:\s*(\d+)/);
  const expectedTotal = totalMatch ? parseInt(totalMatch[1]) : 0;
  console.log('📦 Total de objetos esperado:', expectedTotal);
  
  // Padrão 1: Formato tabular LDI com colunas separadas por |
  // | Grupo | Data | Posição | Objeto | Destinatário |
  const tablePattern = /\|\s*\d+\s*\|\s*(\d{2}\/\d{2}\/\d{4})\s*\|\s*[A-Z]+-\s*\d+\s*\|\s*([A-Z]{2}\d{9}[A-Z]{2})\s*\|\s*([^|]+)\s*\|/g;
  
  let match;
  while ((match = tablePattern.exec(text)) !== null) {
    const [_, date, trackingCode, recipientRaw] = match;
    
    // Limpar nome do destinatário (remover : e texto após, como endereço)
    let recipient = recipientRaw.trim();
    if (recipient.includes(':')) {
      recipient = recipient.split(':')[0].trim();
    }
    
    // Converter data DD/MM/YYYY para YYYY-MM-DD
    const [day, month, year] = date.split('/');
    const arrivalDate = `${year}-${month}-${day}`;
    
    packages.push({
      recipient_name: sanitizeRecipientName(recipient),
      tracking_code: trackingCode,
      arrival_date: arrivalDate,
      confidence: 100 // Alta confiança para formato tabular
    });
  }
  
  console.log(`📊 Padrão tabular: ${packages.length} encomendas encontradas`);
  
  // Padrão 2: Fallback - buscar tracking codes e tentar associar dados
  if (packages.length === 0) {
    console.log('⚠️ Padrão tabular não encontrou dados, tentando fallback...');
    
    const trackingCodes = text.match(TRACKING_CODE_REGEX) || [];
    console.log(`🔍 Códigos de rastreio encontrados (fallback): ${trackingCodes.length}`);
    
    // Procurar por linhas que contenham data + código + nome
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    for (const code of trackingCodes) {
      if (!isValidTrackingCode(code)) continue;
      
      // Encontrar a linha que contém este código
      const lineWithCode = lines.find(line => line.includes(code));
      
      if (lineWithCode) {
        // Tentar extrair data da mesma linha
        const dateMatch = lineWithCode.match(/(\d{2}\/\d{2}\/\d{4})/);
        let arrivalDate = new Date().toISOString().split('T')[0];
        
        if (dateMatch) {
          const [day, month, year] = dateMatch[1].split('/');
          arrivalDate = `${year}-${month}-${day}`;
        }
        
        // Tentar extrair nome (texto após o código, antes de : ou fim da linha)
        const afterCode = lineWithCode.split(code)[1] || '';
        let recipient = afterCode.replace(/[|:].*/g, '').trim();
        
        if (!recipient || recipient.length < 2) {
          recipient = 'NOME NÃO IDENTIFICADO';
        }
        
        packages.push({
          recipient_name: sanitizeRecipientName(recipient),
          tracking_code: code,
          arrival_date: arrivalDate,
          confidence: 50 // Confiança média para fallback
        });
      }
    }
  }
  
  // Remove duplicates by tracking code
  const uniquePackages = packages.filter((pkg, index, self) =>
    index === self.findIndex(p => p.tracking_code === pkg.tracking_code)
  );
  
  // Validar total extraído
  if (expectedTotal > 0 && uniquePackages.length !== expectedTotal) {
    console.log(`⚠️ Atenção: Extraído ${uniquePackages.length} de ${expectedTotal} esperados`);
  }
  
  console.log(`✅ Total final: ${uniquePackages.length} encomendas extraídas`);
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
        // Validate required fields
        if (!pkg.recipient_name || !pkg.tracking_code) {
          results.errors++;
          results.details.push({ tracking_code: pkg.tracking_code || 'N/A', status: 'error', reason: 'Campos obrigatórios faltando' });
          continue;
        }

        // Validate tracking code format
        if (!isValidTrackingCode(pkg.tracking_code)) {
          results.errors++;
          results.details.push({ tracking_code: pkg.tracking_code, status: 'error', reason: 'Formato de código inválido' });
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
          [sanitizeRecipientName(pkg.recipient_name), pkg.tracking_code, arrivalDate.toISOString().split('T')[0], pickupDeadline, filename || null]
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
      [sanitizeRecipientName(recipient_name), tracking_code, arrival_date, pickupDeadline, notes]
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