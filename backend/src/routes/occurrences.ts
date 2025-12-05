import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/occurrences');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// ==================== PUBLIC ROUTES ====================

// Get published occurrences (public)
router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    
    let queryText = `
      SELECT * FROM occurrences 
      WHERE published = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      queryText += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (
        LOWER(title) LIKE LOWER($${paramIndex}) OR 
        LOWER(description) LIKE LOWER($${paramIndex}) OR
        LOWER(location) LIKE LOWER($${paramIndex})
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY created_at DESC`;

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching occurrences:', error);
    res.status(500).json({ error: 'Failed to fetch occurrences' });
  }
});

// Create occurrence (public - from WhatsApp bot or website)
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      location, 
      reporter_name, 
      reporter_phone,
      priority,
      image_url 
    } = req.body;

    // Validate required fields
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({ error: 'Descrição deve ter pelo menos 10 caracteres' });
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({ error: 'Categoria é obrigatória' });
    }

    if (!location || typeof location !== 'string' || location.trim().length < 5) {
      return res.status(400).json({ error: 'Localização deve ter pelo menos 5 caracteres' });
    }

    if (!reporter_name || typeof reporter_name !== 'string' || reporter_name.trim().length < 2) {
      return res.status(400).json({ error: 'Nome do reportador é obrigatório' });
    }

    // Sanitize inputs
    const sanitizedData = {
      title: title?.trim()?.substring(0, 255) || null,
      description: description.trim().substring(0, 2000),
      category: category.trim().substring(0, 100),
      location: location.trim().substring(0, 500),
      reporter_name: reporter_name.trim().substring(0, 255),
      reporter_phone: reporter_phone?.trim()?.substring(0, 20) || null,
      priority: ['low', 'normal', 'high', 'urgent'].includes(priority) ? priority : 'normal',
      image_url: image_url?.substring(0, 500) || null
    };

    const result = await query(
      `INSERT INTO occurrences (title, description, category, location, reporter_name, reporter_phone, priority, image_url, status, published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', false)
       RETURNING *`,
      [
        sanitizedData.title,
        sanitizedData.description,
        sanitizedData.category,
        sanitizedData.location,
        sanitizedData.reporter_name,
        sanitizedData.reporter_phone,
        sanitizedData.priority,
        sanitizedData.image_url
      ]
    );

    console.log(`📢 New occurrence reported: ${sanitizedData.category} at ${sanitizedData.location}`);
    
    res.status(201).json({ 
      success: true, 
      message: 'Ocorrência registrada com sucesso. Aguardando aprovação.',
      occurrence: result.rows[0] 
    });
  } catch (error) {
    console.error('Error creating occurrence:', error);
    res.status(500).json({ error: 'Failed to create occurrence' });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all occurrences (admin)
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    const { status, published } = req.query;
    
    let queryText = `SELECT * FROM occurrences WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (published !== undefined) {
      queryText += ` AND published = $${paramIndex}`;
      params.push(published === 'true');
      paramIndex++;
    }

    queryText += ` ORDER BY 
      CASE status 
        WHEN 'pending' THEN 1 
        WHEN 'in_progress' THEN 2 
        WHEN 'resolved' THEN 3 
        WHEN 'rejected' THEN 4 
      END,
      CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      created_at DESC`;

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all occurrences:', error);
    res.status(500).json({ error: 'Failed to fetch occurrences' });
  }
});

// Get occurrence stats (admin)
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE published = true) as published,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority
      FROM occurrences
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching occurrence stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get single occurrence (admin)
router.get('/admin/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM occurrences WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Occurrence not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching occurrence:', error);
    res.status(500).json({ error: 'Failed to fetch occurrence' });
  }
});

// Update occurrence (admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      category, 
      location, 
      status, 
      priority, 
      admin_notes, 
      published 
    } = req.body;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Prioridade inválida' });
    }

    const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;

    const result = await query(
      `UPDATE occurrences SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        location = COALESCE($4, location),
        status = COALESCE($5, status),
        priority = COALESCE($6, priority),
        admin_notes = COALESCE($7, admin_notes),
        published = COALESCE($8, published),
        resolved_at = COALESCE($9, resolved_at),
        updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        title?.trim()?.substring(0, 255),
        description?.trim()?.substring(0, 2000),
        category?.trim()?.substring(0, 100),
        location?.trim()?.substring(0, 500),
        status,
        priority,
        admin_notes?.trim()?.substring(0, 1000),
        published,
        resolvedAt,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Occurrence not found' });
    }

    console.log(`📝 Occurrence ${id} updated: status=${status}, published=${published}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating occurrence:', error);
    res.status(500).json({ error: 'Failed to update occurrence' });
  }
});

// Approve/Publish occurrence (admin shortcut)
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const result = await query(
      `UPDATE occurrences SET 
        status = 'in_progress',
        published = true,
        admin_notes = COALESCE($1, admin_notes),
        updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [admin_notes?.trim()?.substring(0, 1000), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Occurrence not found' });
    }

    console.log(`✅ Occurrence ${id} approved and published`);
    res.json({ success: true, occurrence: result.rows[0] });
  } catch (error) {
    console.error('Error approving occurrence:', error);
    res.status(500).json({ error: 'Failed to approve occurrence' });
  }
});

// Reject occurrence (admin shortcut)
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const result = await query(
      `UPDATE occurrences SET 
        status = 'rejected',
        published = false,
        admin_notes = COALESCE($1, admin_notes),
        updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [admin_notes?.trim()?.substring(0, 1000), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Occurrence not found' });
    }

    console.log(`❌ Occurrence ${id} rejected`);
    res.json({ success: true, occurrence: result.rows[0] });
  } catch (error) {
    console.error('Error rejecting occurrence:', error);
    res.status(500).json({ error: 'Failed to reject occurrence' });
  }
});

// Mark as resolved (admin shortcut)
router.post('/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const result = await query(
      `UPDATE occurrences SET 
        status = 'resolved',
        admin_notes = COALESCE($1, admin_notes),
        resolved_at = NOW(),
        updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [admin_notes?.trim()?.substring(0, 1000), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Occurrence not found' });
    }

    console.log(`✅ Occurrence ${id} marked as resolved`);
    res.json({ success: true, occurrence: result.rows[0] });
  } catch (error) {
    console.error('Error resolving occurrence:', error);
    res.status(500).json({ error: 'Failed to resolve occurrence' });
  }
});

// Delete occurrence (admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get image URL before deleting
    const occurrence = await query('SELECT image_url FROM occurrences WHERE id = $1', [id]);
    
    if (occurrence.rows.length === 0) {
      return res.status(404).json({ error: 'Occurrence not found' });
    }

    // Delete the image file if exists
    if (occurrence.rows[0].image_url) {
      const imagePath = path.join(__dirname, '../../', occurrence.rows[0].image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await query('DELETE FROM occurrences WHERE id = $1', [id]);

    console.log(`🗑️ Occurrence ${id} deleted`);
    res.json({ success: true, message: 'Occurrence deleted successfully' });
  } catch (error) {
    console.error('Error deleting occurrence:', error);
    res.status(500).json({ error: 'Failed to delete occurrence' });
  }
});

// Upload image for occurrence (admin)
router.post('/:id/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageUrl = `/uploads/occurrences/${req.file.filename}`;

    // Get old image URL
    const oldOccurrence = await query('SELECT image_url FROM occurrences WHERE id = $1', [id]);
    
    // Delete old image if exists
    if (oldOccurrence.rows[0]?.image_url) {
      const oldPath = path.join(__dirname, '../../', oldOccurrence.rows[0].image_url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update occurrence with new image
    const result = await query(
      'UPDATE occurrences SET image_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [imageUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Occurrence not found' });
    }

    res.json({ success: true, image_url: imageUrl, occurrence: result.rows[0] });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
