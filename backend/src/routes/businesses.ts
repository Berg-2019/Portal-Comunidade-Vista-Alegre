import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { uploadSingle, uploadBusinessSingle } from '../middleware/upload';

const router = Router();

// Public: Submit business for approval (no auth required)
router.post('/register', uploadBusinessSingle('image'), async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category_id,
      address,
      location,
      phone,
      whatsapp,
      instagram_url,
      website_url,
      opening_hours,
      owner_name,
      owner_phone,
    } = req.body;

    if (!name || !description || !category_id || !owner_name || !owner_phone) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }

    const imageUrl = req.file ? `/uploads/businesses/${req.file.filename}` : null;

    const result = await query(
      `INSERT INTO businesses (
        name, description, category_id, address, location, phone, whatsapp,
        instagram_url, website_url, opening_hours, owner_name, owner_phone,
        image_url, status, is_sponsor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', false)
      RETURNING *`,
      [
        name, description, category_id, address, location, phone, whatsapp,
        instagram_url, website_url, opening_hours, owner_name, owner_phone, imageUrl
      ]
    );

    console.log(`📝 New business registration: ${name} by ${owner_name}`);

    res.status(201).json({
      success: true,
      message: 'Cadastro enviado para aprovação',
      business: result.rows[0],
    });
  } catch (error) {
    console.error('Error registering business:', error);
    res.status(500).json({ error: 'Erro ao cadastrar comércio' });
  }
});

// Public: Get approved businesses
router.get('/', async (req: Request, res: Response) => {
  try {
    const { sponsors_only } = req.query;
    
    let queryText = `
      SELECT b.*, bc.name as category_name, bc.slug as category_slug
      FROM businesses b
      LEFT JOIN business_categories bc ON b.category_id = bc.id
      WHERE b.status = 'approved'
    `;
    
    if (sponsors_only === 'true') {
      queryText += ` AND b.is_sponsor = true`;
    }
    
    queryText += ` ORDER BY b.is_sponsor DESC, b.name ASC`;

    const result = await query(queryText);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ error: 'Erro ao buscar comércios' });
  }
});

// Public: Get business categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM business_categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Admin: Get all businesses (including pending)
router.get('/admin/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT b.*, bc.name as category_name, bc.slug as category_slug
      FROM businesses b
      LEFT JOIN business_categories bc ON b.category_id = bc.id
      ORDER BY 
        CASE b.status 
          WHEN 'pending' THEN 1 
          WHEN 'approved' THEN 2 
          ELSE 3 
        END,
        b.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all businesses:', error);
    res.status(500).json({ error: 'Erro ao buscar comércios' });
  }
});

// Admin: Get pending businesses count
router.get('/admin/pending-count', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await query(`SELECT COUNT(*) FROM businesses WHERE status = 'pending'`);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error counting pending:', error);
    res.status(500).json({ error: 'Erro ao contar pendentes' });
  }
});

// Admin: Create business (auto-approved)
router.post('/admin/create', authenticateToken, uploadBusinessSingle('image'), async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category_id,
      address,
      location,
      phone,
      whatsapp,
      instagram_url,
      website_url,
      opening_hours,
      is_sponsor,
    } = req.body;

    if (!name || !description || !category_id) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    }

    const imageUrl = req.file ? `/uploads/businesses/${req.file.filename}` : req.body.image_url || null;

    const result = await query(
      `INSERT INTO businesses (
        name, description, category_id, address, location, phone, whatsapp,
        instagram_url, website_url, opening_hours, image_url, status, is_sponsor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'approved', $12)
      RETURNING *`,
      [
        name, description, category_id, address, location, phone, whatsapp,
        instagram_url, website_url, opening_hours, imageUrl, is_sponsor === 'true' || is_sponsor === true
      ]
    );

    console.log(`✅ Admin created business: ${name}`);

    res.status(201).json({
      success: true,
      message: 'Comércio criado com sucesso',
      business: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ error: 'Erro ao criar comércio' });
  }
});

// Admin: Approve business
router.put('/admin/:id/approve', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE businesses SET status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comércio não encontrado' });
    }

    console.log(`✅ Business approved: ${result.rows[0].name}`);
    res.json({ success: true, business: result.rows[0] });
  } catch (error) {
    console.error('Error approving business:', error);
    res.status(500).json({ error: 'Erro ao aprovar comércio' });
  }
});

// Admin: Reject business
router.put('/admin/:id/reject', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE businesses SET status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comércio não encontrado' });
    }

    console.log(`❌ Business rejected: ${result.rows[0].name}`);
    res.json({ success: true, business: result.rows[0] });
  } catch (error) {
    console.error('Error rejecting business:', error);
    res.status(500).json({ error: 'Erro ao rejeitar comércio' });
  }
});

// Admin: Update business
router.put('/admin/:id', authenticateToken, uploadBusinessSingle('image'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name, description, category_id, address, location, phone, whatsapp,
      instagram_url, website_url, opening_hours, is_sponsor, status
    } = req.body;

    let imageUrl = req.body.image_url;
    if (req.file) {
      imageUrl = `/uploads/businesses/${req.file.filename}`;
    }

    const result = await query(
      `UPDATE businesses SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category_id = COALESCE($3, category_id),
        address = COALESCE($4, address),
        location = COALESCE($5, location),
        phone = COALESCE($6, phone),
        whatsapp = COALESCE($7, whatsapp),
        instagram_url = COALESCE($8, instagram_url),
        website_url = COALESCE($9, website_url),
        opening_hours = COALESCE($10, opening_hours),
        is_sponsor = COALESCE($11, is_sponsor),
        status = COALESCE($12, status),
        image_url = COALESCE($13, image_url),
        updated_at = NOW()
      WHERE id = $14 RETURNING *`,
      [name, description, category_id, address, location, phone, whatsapp,
       instagram_url, website_url, opening_hours, is_sponsor, status, imageUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comércio não encontrado' });
    }

    res.json({ success: true, business: result.rows[0] });
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Erro ao atualizar comércio' });
  }
});

// Admin: Delete business
router.delete('/admin/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM businesses WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comércio não encontrado' });
    }

    console.log(`🗑️ Business deleted: ${result.rows[0].name}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ error: 'Erro ao excluir comércio' });
  }
});

export default router;
