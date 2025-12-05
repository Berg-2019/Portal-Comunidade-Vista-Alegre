import { Router } from 'express';
import { query } from '../config/database';
import { authMiddleware, AuthRequest, requirePermission } from '../middleware/auth';

const router = Router();

// Get all news (public)
router.get('/', async (req, res) => {
  try {
    const onlyPublished = req.query.published === 'true';
    
    let queryText = `
      SELECT n.*, nc.name as category_name, u.name as author_name
      FROM news n
      LEFT JOIN news_categories nc ON n.category_id = nc.id
      LEFT JOIN users u ON n.author_id = u.id
    `;

    if (onlyPublished) {
      queryText += ' WHERE n.published = true';
    }

    queryText += ' ORDER BY n.created_at DESC';

    const result = await query(queryText);
    res.json(result.rows);
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
});

// Get news by slug (public)
router.get('/slug/:slug', async (req, res) => {
  try {
    const result = await query(
      `SELECT n.*, nc.name as category_name, u.name as author_name
       FROM news n
       LEFT JOIN news_categories nc ON n.category_id = nc.id
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.slug = $1`,
      [req.params.slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notícia não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get news by slug error:', error);
    res.status(500).json({ error: 'Erro ao buscar notícia' });
  }
});

// Get news by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT n.*, nc.name as category_name, u.name as author_name
       FROM news n
       LEFT JOIN news_categories nc ON n.category_id = nc.id
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notícia não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ error: 'Erro ao buscar notícia' });
  }
});

// Create news (authenticated)
router.post('/', authMiddleware, requirePermission('news'), async (req: AuthRequest, res) => {
  try {
    const { title, summary, content, categoryId, imageUrl, videoUrl, published } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
    }

    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const result = await query(
      `INSERT INTO news (title, slug, summary, content, category_id, image_url, video_url, published, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, slug, summary, content, categoryId || null, imageUrl, videoUrl, published || false, req.user?.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({ error: 'Erro ao criar notícia' });
  }
});

// Update news (authenticated)
router.put('/:id', authMiddleware, requirePermission('news'), async (req: AuthRequest, res) => {
  try {
    const { title, summary, content, categoryId, imageUrl, videoUrl, published } = req.body;

    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const result = await query(
      `UPDATE news 
       SET title = $1, slug = $2, summary = $3, content = $4, category_id = $5, 
           image_url = $6, video_url = $7, published = $8, updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [title, slug, summary, content, categoryId || null, imageUrl, videoUrl, published, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notícia não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({ error: 'Erro ao atualizar notícia' });
  }
});

// Delete news (authenticated)
router.delete('/:id', authMiddleware, requirePermission('news'), async (req: AuthRequest, res) => {
  try {
    const result = await query('DELETE FROM news WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notícia não encontrada' });
    }

    res.json({ success: true, message: 'Notícia excluída com sucesso' });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ error: 'Erro ao excluir notícia' });
  }
});

// Get categories
router.get('/categories/all', async (req, res) => {
  try {
    const result = await query('SELECT * FROM news_categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

export default router;
