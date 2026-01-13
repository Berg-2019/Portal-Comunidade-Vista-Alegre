import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET all reservations (admin only)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { court_id, status, date_from, date_to } = req.query;
    
    let sql = `
      SELECT r.*, c.name as court_name, c.type as court_type
      FROM court_reservations r
      JOIN courts c ON r.court_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (court_id) {
      sql += ` AND r.court_id = $${paramIndex++}`;
      params.push(court_id);
    }

    if (status) {
      sql += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }

    if (date_from) {
      sql += ` AND r.reservation_date >= $${paramIndex++}`;
      params.push(date_from);
    }

    if (date_to) {
      sql += ` AND r.reservation_date <= $${paramIndex++}`;
      params.push(date_to);
    }

    sql += ' ORDER BY r.reservation_date DESC, r.start_time';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
});

// GET reservations stats (admin only)
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE reservation_date = CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE reservation_date > CURRENT_DATE) as upcoming
      FROM court_reservations
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching reservation stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET reservations by court and date (public - for availability check)
router.get('/availability/:courtId/:date', async (req: Request, res: Response) => {
  try {
    const { courtId, date } = req.params;
    
    const result = await query(
      `SELECT start_time, end_time 
       FROM court_reservations 
       WHERE court_id = $1 
         AND reservation_date = $2 
         AND status = 'confirmed'`,
      [courtId, date]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Erro ao verificar disponibilidade' });
  }
});

// POST create reservation (public - used by WhatsApp bot)
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      court_id,
      slot_id,
      user_name,
      user_phone,
      reservation_date,
      start_time,
      end_time,
      source = 'whatsapp',
      notes
    } = req.body;

    if (!court_id || !user_name || !user_phone || !reservation_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Check for existing reservation at same time
    const existingCheck = await query(
      `SELECT id FROM court_reservations 
       WHERE court_id = $1 
         AND reservation_date = $2 
         AND status = 'confirmed'
         AND (
           (start_time <= $3 AND end_time > $3)
           OR (start_time < $4 AND end_time >= $4)
           OR (start_time >= $3 AND end_time <= $4)
         )`,
      [court_id, reservation_date, start_time, end_time]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Horário já reservado' });
    }

    const result = await query(
      `INSERT INTO court_reservations 
       (court_id, slot_id, user_name, user_phone, reservation_date, start_time, end_time, source, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [court_id, slot_id, user_name, user_phone, reservation_date, start_time, end_time, source, notes]
    );

    res.status(201).json({ success: true, reservation: result.rows[0] });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Erro ao criar reserva' });
  }
});

// PUT update reservation status (admin only)
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const result = await query(
      `UPDATE court_reservations 
       SET status = COALESCE($1, status),
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    res.json({ success: true, reservation: result.rows[0] });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: 'Erro ao atualizar reserva' });
  }
});

// PUT cancel reservation
router.put('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE court_reservations 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    res.json({ success: true, reservation: result.rows[0] });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ error: 'Erro ao cancelar reserva' });
  }
});

// DELETE reservation (admin only)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM court_reservations WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ error: 'Erro ao excluir reserva' });
  }
});

// GET upcoming reservations that need reminder (for bot)
router.get('/upcoming-reminders', async (req: Request, res: Response) => {
  try {
    // Get reservations for today that are confirmed, 
    // haven't had reminder sent, and start within the next 15 minutes
    const result = await query(`
      SELECT r.*, c.name as court_name
      FROM court_reservations r
      JOIN courts c ON r.court_id = c.id
      WHERE r.reservation_date = CURRENT_DATE
        AND r.status = 'confirmed'
        AND r.reminder_sent = false
        AND r.start_time <= (CURRENT_TIME + INTERVAL '15 minutes')
        AND r.start_time > CURRENT_TIME
      ORDER BY r.start_time
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error);
    res.status(500).json({ error: 'Erro ao buscar lembretes' });
  }
});

// PUT mark reminder as sent
router.put('/:id/reminder-sent', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE court_reservations 
       SET reminder_sent = true, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    res.json({ success: true, reservation: result.rows[0] });
  } catch (error) {
    console.error('Error marking reminder as sent:', error);
    res.status(500).json({ error: 'Erro ao atualizar lembrete' });
  }
});

// PUT confirm reservation (from reminder response)
router.put('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `UPDATE court_reservations 
       SET status = 'confirmed', notes = COALESCE(notes, '') || ' [Presença confirmada via WhatsApp]', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    res.json({ success: true, reservation: result.rows[0] });
  } catch (error) {
    console.error('Error confirming reservation:', error);
    res.status(500).json({ error: 'Erro ao confirmar reserva' });
  }
});

export default router;
