import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for court images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/courts');
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

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Public: Get all courts
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT c.*, 
        COALESCE(
          (SELECT json_agg(mp) FROM court_maintenance_periods mp WHERE mp.court_id = c.id AND mp.end_date >= CURRENT_DATE),
          '[]'
        ) as maintenance_periods
      FROM courts c 
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching courts:', error);
    res.status(500).json({ error: 'Error fetching courts' });
  }
});

// Public: Get time slots for a court
router.get('/:id/slots', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { day_of_week } = req.query;

    let queryText = 'SELECT * FROM court_time_slots WHERE court_id = $1';
    const params: any[] = [id];

    if (day_of_week !== undefined) {
      queryText += ' AND day_of_week = $2';
      params.push(day_of_week);
    }

    queryText += ' ORDER BY day_of_week, start_time';

    const slotsResult = await query(queryText, params);
    
    // Buscar períodos de manutenção ativos
    const maintenanceResult = await query(
      `SELECT * FROM court_maintenance_periods 
       WHERE court_id = $1 AND end_date >= CURRENT_DATE 
       ORDER BY start_date`,
      [id]
    );

    // Retornar no formato esperado pelo frontend
    res.json({
      slots: slotsResult.rows,
      maintenancePeriods: maintenanceResult.rows
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Error fetching slots' });
  }
});

// Admin: Create court
router.post('/', authenticateToken, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { name, type, description } = req.body;
    const imageUrl = req.file ? `/uploads/courts/${req.file.filename}` : null;

    const result = await query(
      `INSERT INTO courts (name, type, description, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, type, description, imageUrl]
    );

    res.json({ success: true, court: result.rows[0] });
  } catch (error) {
    console.error('Error creating court:', error);
    res.status(500).json({ error: 'Error creating court' });
  }
});

// Admin: Update court
router.put('/:id', authenticateToken, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, description, available } = req.body;
    const imageUrl = req.file ? `/uploads/courts/${req.file.filename}` : undefined;

    const result = await query(
      `UPDATE courts 
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           description = COALESCE($3, description),
           available = COALESCE($4, available),
           image_url = COALESCE($5, image_url),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, type, description, available, imageUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Court not found' });
    }

    res.json({ success: true, court: result.rows[0] });
  } catch (error) {
    console.error('Error updating court:', error);
    res.status(500).json({ error: 'Error updating court' });
  }
});

// Admin: Toggle maintenance mode
router.put('/:id/maintenance', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { maintenance_mode, maintenance_reason, maintenance_start, maintenance_end } = req.body;

    const result = await query(
      `UPDATE courts 
       SET maintenance_mode = $1,
           maintenance_reason = $2,
           maintenance_start = $3,
           maintenance_end = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [maintenance_mode, maintenance_reason, maintenance_start, maintenance_end, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Court not found' });
    }

    res.json({ success: true, court: result.rows[0] });
  } catch (error) {
    console.error('Error updating maintenance:', error);
    res.status(500).json({ error: 'Error updating maintenance' });
  }
});

// Admin: Add maintenance period
router.post('/:id/maintenance-period', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, start_time, end_time, reason } = req.body;

    const result = await query(
      `INSERT INTO court_maintenance_periods (court_id, start_date, end_date, start_time, end_time, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, start_date, end_date, start_time, end_time, reason]
    );

    res.json({ success: true, period: result.rows[0] });
  } catch (error) {
    console.error('Error adding maintenance period:', error);
    res.status(500).json({ error: 'Error adding maintenance period' });
  }
});

// Admin: Delete maintenance period
router.delete('/maintenance-period/:periodId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { periodId } = req.params;
    
    await query('DELETE FROM court_maintenance_periods WHERE id = $1', [periodId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting maintenance period:', error);
    res.status(500).json({ error: 'Error deleting maintenance period' });
  }
});

// Admin: Delete court
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await query('DELETE FROM courts WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting court:', error);
    res.status(500).json({ error: 'Error deleting court' });
  }
});

// Admin: Add time slot
router.post('/:id/slots', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { day_of_week, start_time, end_time } = req.body;

    const result = await query(
      `INSERT INTO court_time_slots (court_id, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, day_of_week, start_time, end_time]
    );

    res.json({ success: true, slot: result.rows[0] });
  } catch (error) {
    console.error('Error adding slot:', error);
    res.status(500).json({ error: 'Error adding slot' });
  }
});

// Admin: Toggle slot availability
router.put('/slots/:slotId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;
    const { available } = req.body;

    const result = await query(
      `UPDATE court_time_slots SET available = $1 WHERE id = $2 RETURNING *`,
      [available, slotId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    res.json({ success: true, slot: result.rows[0] });
  } catch (error) {
    console.error('Error updating slot:', error);
    res.status(500).json({ error: 'Error updating slot' });
  }
});

// Admin: Delete time slot
router.delete('/slots/:slotId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;
    
    await query('DELETE FROM court_time_slots WHERE id = $1', [slotId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting slot:', error);
    res.status(500).json({ error: 'Error deleting slot' });
  }
});

export default router;
