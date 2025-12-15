import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { query } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Rate limiter específico para login (proteção contra brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login por 15 minutos
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login (com rate limit restritivo)
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const result = await query(
      'SELECT id, name, email, password_hash, role, permissions, active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];

    if (!user.active) {
      return res.status(401).json({ error: 'Usuário desativado' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('ERRO CRÍTICO: JWT_SECRET não está definido nas variáveis de ambiente');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, permissions FROM users WHERE id = $1',
      [req.user?.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create initial admin user (only if no users exist)
router.post('/setup', async (req, res) => {
  try {
    const existingUsers = await query('SELECT COUNT(*) FROM users');
    
    if (parseInt(existingUsers.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Setup já realizado' });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, permissions) 
       VALUES ($1, $2, $3, 'developer', $4) 
       RETURNING id, name, email, role`,
      [name, email, passwordHash, JSON.stringify({
        news: true,
        occurrences: true,
        courts: true,
        packages: true,
        businesses: true,
        contacts: true,
        users: true,
        settings: true,
      })]
    );

    res.status(201).json({
      message: 'Usuário administrador criado com sucesso',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
