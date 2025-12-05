import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public: Get active WhatsApp groups
router.get('/groups', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT * FROM whatsapp_groups 
      WHERE is_active = true 
      ORDER BY order_index, name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Error fetching groups' });
  }
});

// Admin: Get all WhatsApp groups
router.get('/groups/admin', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT * FROM whatsapp_groups 
      ORDER BY order_index, name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Error fetching groups' });
  }
});

// Admin: Create WhatsApp group
router.post('/groups', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, description, category, invite_link, icon, member_count } = req.body;

    // Get next order index
    const orderResult = await query('SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM whatsapp_groups');
    const orderIndex = orderResult.rows[0].next_order;

    const result = await query(
      `INSERT INTO whatsapp_groups (name, description, category, invite_link, icon, member_count, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, category, invite_link, icon, member_count, orderIndex]
    );

    res.json({ success: true, group: result.rows[0] });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Error creating group' });
  }
});

// Admin: Update WhatsApp group
router.put('/groups/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, category, invite_link, icon, member_count, is_active, order_index } = req.body;

    const result = await query(
      `UPDATE whatsapp_groups 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           invite_link = COALESCE($4, invite_link),
           icon = COALESCE($5, icon),
           member_count = COALESCE($6, member_count),
           is_active = COALESCE($7, is_active),
           order_index = COALESCE($8, order_index),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, description, category, invite_link, icon, member_count, is_active, order_index, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ success: true, group: result.rows[0] });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Error updating group' });
  }
});

// Admin: Delete WhatsApp group
router.delete('/groups/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await query('DELETE FROM whatsapp_groups WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Error deleting group' });
  }
});

// Admin: Reorder groups
router.put('/groups/reorder', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groups } = req.body; // Array of { id, order_index }

    for (const group of groups) {
      await query(
        'UPDATE whatsapp_groups SET order_index = $1 WHERE id = $2',
        [group.order_index, group.id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering groups:', error);
    res.status(500).json({ error: 'Error reordering groups' });
  }
});

export default router;
