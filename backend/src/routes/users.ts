import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all users (admin only)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'developer' && !req.user?.permissions?.users) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const result = await query(
      'SELECT id, name, email, role, permissions, active, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create user (admin only)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'developer' && !req.user?.permissions?.users) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { name, email, password, role, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    // Check if email already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, permissions) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, role, permissions, active, created_at`,
      [name, email, passwordHash, role || 'admin', JSON.stringify(permissions || {})]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update user (admin only)
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'developer' && !req.user?.permissions?.users) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { id } = req.params;
    const { name, email, password, role, permissions, active } = req.body;

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Check if email is being changed and already exists
    if (email) {
      const emailExists = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailExists.rows.length > 0) {
        return res.status(400).json({ error: 'Email já em uso' });
      }
    }

    let updateQuery = 'UPDATE users SET updated_at = NOW()';
    const params: any[] = [];
    let paramIndex = 1;

    if (name) {
      updateQuery += `, name = $${paramIndex++}`;
      params.push(name);
    }
    if (email) {
      updateQuery += `, email = $${paramIndex++}`;
      params.push(email);
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateQuery += `, password_hash = $${paramIndex++}`;
      params.push(passwordHash);
    }
    if (role) {
      updateQuery += `, role = $${paramIndex++}`;
      params.push(role);
    }
    if (permissions !== undefined) {
      updateQuery += `, permissions = $${paramIndex++}`;
      params.push(JSON.stringify(permissions));
    }
    if (active !== undefined) {
      updateQuery += `, active = $${paramIndex++}`;
      params.push(active);
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, name, email, role, permissions, active, created_at`;
    params.push(id);

    const result = await query(updateQuery, params);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'developer' && !req.user?.permissions?.users) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const { id } = req.params;

    // Prevent deleting the last user
    const userCount = await query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Não é possível excluir o último usuário' });
    }

    // Prevent self-deletion
    if (req.user?.id === parseInt(id)) {
      return res.status(400).json({ error: 'Não é possível excluir o próprio usuário' });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
