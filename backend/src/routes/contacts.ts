import { Router } from 'express';
import { query } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all categories (public)
router.get('/categories', async (_req, res) => {
  try {
    const result = await query(
      'SELECT id, name, slug FROM contact_categories ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get contact categories error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get all contacts (public)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    
    let queryText = `
      SELECT c.*, cc.name as category_name, cc.slug as category_slug
      FROM useful_contacts c
      LEFT JOIN contact_categories cc ON c.category_id = cc.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      params.push(category);
      queryText += ` AND cc.slug = $${params.length}`;
    }

    queryText += ' ORDER BY cc.name, c.name';

    const result = await query(queryText, params);
    
    // Format for frontend compatibility
    const formattedContacts = result.rows.map(contact => ({
      id: contact.id.toString(),
      name: contact.name,
      categoryId: contact.category_id?.toString() || '',
      phone: contact.phone,
      address: contact.address,
      openingHours: contact.opening_hours,
      description: contact.description,
      createdAt: contact.created_at,
      updatedAt: contact.updated_at,
    }));

    res.json(formattedContacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Admin: Get all contacts
router.get('/admin/all', authMiddleware, async (_req, res) => {
  try {
    const result = await query(`
      SELECT c.*, cc.name as category_name
      FROM useful_contacts c
      LEFT JOIN contact_categories cc ON c.category_id = cc.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all contacts error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create contact (admin only)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, category_id, phone, address, opening_hours, description } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }

    const result = await query(
      `INSERT INTO useful_contacts (name, category_id, phone, address, opening_hours, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, category_id || null, phone, address || null, opening_hours || null, description || null]
    );

    res.status(201).json({ success: true, contact: result.rows[0] });
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update contact (admin only)
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, phone, address, opening_hours, description } = req.body;

    const result = await query(
      `UPDATE useful_contacts SET
        name = COALESCE($1, name),
        category_id = $2,
        phone = COALESCE($3, phone),
        address = $4,
        opening_hours = $5,
        description = $6,
        updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, category_id || null, phone, address || null, opening_hours || null, description || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    res.json({ success: true, contact: result.rows[0] });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Delete contact (admin only)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM useful_contacts WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create category (admin only)
router.post('/categories', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Nome e slug são obrigatórios' });
    }

    const result = await query(
      'INSERT INTO contact_categories (name, slug) VALUES ($1, $2) RETURNING *',
      [name, slug]
    );

    res.status(201).json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
