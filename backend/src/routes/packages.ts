import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// Public: Get packages (for public consultation)
router.get('/', async (req: Request, res: Response) => {
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
router.get('/admin/all', authenticateToken, async (req: Request, res: Response) => {
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
router.get('/admin/stats', authenticateToken, async (req: Request, res: Response) => {
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

// Admin: Upload PDF and extract packages
router.post('/upload-pdf', authenticateToken, upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // For now, we'll parse the manual data sent along with the PDF
    // In a production environment, you'd use pdf-parse library to extract text
    const { packages: manualPackages } = req.body;
    
    let packagesToInsert = [];
    
    if (manualPackages) {
      packagesToInsert = JSON.parse(manualPackages);
    }

    const results = {
      imported: 0,
      duplicates: 0,
      errors: 0,
      details: [] as any[]
    };

    for (const pkg of packagesToInsert) {
      try {
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
        const arrivalDate = new Date(pkg.arrival_date);
        const pickupDeadline = new Date(arrivalDate);
        pickupDeadline.setDate(pickupDeadline.getDate() + 7);

        await query(
          `INSERT INTO packages (recipient_name, tracking_code, status, arrival_date, pickup_deadline, pdf_source)
           VALUES ($1, $2, 'aguardando', $3, $4, $5)`,
          [pkg.recipient_name, pkg.tracking_code, pkg.arrival_date, pickupDeadline, req.file.filename]
        );

        results.imported++;
        results.details.push({ tracking_code: pkg.tracking_code, status: 'imported' });
      } catch (err) {
        results.errors++;
        results.details.push({ tracking_code: pkg.tracking_code, status: 'error' });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Error processing PDF' });
  }
});

// Admin: Create package manually
router.post('/', authenticateToken, async (req: Request, res: Response) => {
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
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
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
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ success: true, package: result.rows[0] });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Error updating package' });
  }
});

// Admin: Delete package
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query('DELETE FROM packages WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Error deleting package' });
  }
});

export default router;
