import { Router } from 'express';
import { query } from '../config/database';
import { authMiddleware, AuthRequest, requirePermission } from '../middleware/auth';

const router = Router();

// Get all settings (public)
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM site_settings');
    
    const settings: Record<string, string> = {};
    result.rows.forEach((row) => {
      settings[row.key] = row.value;
    });

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// Update settings (authenticated - only developers)
router.put('/', authMiddleware, requirePermission('settings'), async (req: AuthRequest, res) => {
  try {
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Configurações inválidas' });
    }

    for (const [key, value] of Object.entries(settings)) {
      await query(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value as string]
      );
    }

    res.json({ success: true, message: 'Configurações salvas com sucesso' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// Get single setting
router.get('/:key', async (req, res) => {
  try {
    const result = await query('SELECT value FROM site_settings WHERE key = $1', [req.params.key]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuração não encontrada' });
    }

    res.json({ key: req.params.key, value: result.rows[0].value });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Erro ao buscar configuração' });
  }
});

export default router;
