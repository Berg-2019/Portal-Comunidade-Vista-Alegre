import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET all schedules (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { court_id, day_of_week, active } = req.query;
    
    let sql = `
      SELECT fs.*, c.name as court_name, c.type as court_type
      FROM fixed_schedules fs
      JOIN courts c ON fs.court_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (court_id) {
      sql += ` AND fs.court_id = $${paramIndex++}`;
      params.push(court_id);
    }

    if (day_of_week !== undefined) {
      sql += ` AND fs.day_of_week = $${paramIndex++}`;
      params.push(day_of_week);
    }

    if (active !== undefined) {
      sql += ` AND fs.active = $${paramIndex++}`;
      params.push(active === 'true');
    }

    sql += ' ORDER BY fs.day_of_week, fs.start_time';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// GET schedule by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT fs.*, c.name as court_name 
       FROM fixed_schedules fs 
       JOIN courts c ON fs.court_id = c.id 
       WHERE fs.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamento' });
  }
});

// POST create schedule (admin only)
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      court_id,
      project_name,
      project_type,
      day_of_week,
      start_time,
      end_time,
      responsible,
      phone
    } = req.body;

    if (!court_id || !project_name || !project_type || day_of_week === undefined || !start_time || !end_time || !responsible) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const result = await query(
      `INSERT INTO fixed_schedules 
       (court_id, project_name, project_type, day_of_week, start_time, end_time, responsible, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [court_id, project_name, project_type, day_of_week, start_time, end_time, responsible, phone]
    );

    res.status(201).json({ success: true, schedule: result.rows[0] });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// PUT update schedule (admin only)
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      court_id,
      project_name,
      project_type,
      day_of_week,
      start_time,
      end_time,
      responsible,
      phone,
      active
    } = req.body;

    const result = await query(
      `UPDATE fixed_schedules 
       SET court_id = COALESCE($1, court_id),
           project_name = COALESCE($2, project_name),
           project_type = COALESCE($3, project_type),
           day_of_week = COALESCE($4, day_of_week),
           start_time = COALESCE($5, start_time),
           end_time = COALESCE($6, end_time),
           responsible = COALESCE($7, responsible),
           phone = COALESCE($8, phone),
           active = COALESCE($9, active),
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [court_id, project_name, project_type, day_of_week, start_time, end_time, responsible, phone, active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json({ success: true, schedule: result.rows[0] });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

// PATCH toggle active status (admin only)
router.patch('/:id/toggle', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE fixed_schedules 
       SET active = NOT active, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json({ success: true, schedule: result.rows[0] });
  } catch (error) {
    console.error('Error toggling schedule:', error);
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
});

// DELETE schedule (admin only)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM fixed_schedules WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Erro ao excluir agendamento' });
  }
});

export default router;
