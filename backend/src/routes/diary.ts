import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// Get all diaries with activities (public)
router.get('/', async (req, res) => {
    try {
        const { data_inicio, data_fim, tipo } = req.query;

        let queryText = `
      SELECT d.*, 
        (SELECT json_agg(t.*) FROM tempo_diario t WHERE t.diario_id = d.id) as tempo,
        (SELECT COUNT(*) FROM atividades_obra a WHERE a.diario_id = d.id) as total_atividades
      FROM diarios_de_obra d
      WHERE 1=1
    `;
        const params: any[] = [];
        let paramIndex = 1;

        if (data_inicio) {
            queryText += ` AND d.data >= $${paramIndex}`;
            params.push(data_inicio);
            paramIndex++;
        }

        if (data_fim) {
            queryText += ` AND d.data <= $${paramIndex}`;
            params.push(data_fim);
            paramIndex++;
        }

        if (tipo) {
            queryText += ` AND EXISTS (SELECT 1 FROM atividades_obra a WHERE a.diario_id = d.id AND a.tipo = $${paramIndex})`;
            params.push(tipo);
            paramIndex++;
        }

        queryText += ` ORDER BY d.data DESC`;

        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching diaries:', error);
        res.status(500).json({ error: 'Failed to fetch diaries' });
    }
});

// Get single diary with all details (public)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get diary
        const diarioResult = await query('SELECT * FROM diarios_de_obra WHERE id = $1', [id]);
        if (diarioResult.rows.length === 0) {
            return res.status(404).json({ error: 'Diary not found' });
        }

        // Get weather
        const tempoResult = await query('SELECT * FROM tempo_diario WHERE diario_id = $1 ORDER BY periodo', [id]);

        // Get activities with contest count
        const atividadesResult = await query(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM contestacoes_atividade c WHERE c.atividade_id = a.id) as total_contestacoes
      FROM atividades_obra a 
      WHERE a.diario_id = $1 
      ORDER BY a.ordem, a.id
    `, [id]);

        res.json({
            ...diarioResult.rows[0],
            tempo: tempoResult.rows,
            atividades: atividadesResult.rows
        });
    } catch (error) {
        console.error('Error fetching diary:', error);
        res.status(500).json({ error: 'Failed to fetch diary' });
    }
});

// Get activity types (public)
router.get('/tipos/atividades', async (req, res) => {
    try {
        const result = await query('SELECT * FROM tipos_atividade_obra ORDER BY nome');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching activity types:', error);
        res.status(500).json({ error: 'Failed to fetch activity types' });
    }
});

// Submit contest for an activity (public)
router.post('/activities/:id/contest', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_morador, contato, mensagem } = req.body;

        // Validate required fields
        if (!nome_morador || nome_morador.trim().length < 2) {
            return res.status(400).json({ error: 'Nome é obrigatório (mínimo 2 caracteres)' });
        }
        if (!mensagem || mensagem.trim().length < 10) {
            return res.status(400).json({ error: 'Mensagem deve ter pelo menos 10 caracteres' });
        }

        // Check activity exists
        const activity = await query('SELECT id FROM atividades_obra WHERE id = $1', [id]);
        if (activity.rows.length === 0) {
            return res.status(404).json({ error: 'Atividade não encontrada' });
        }

        const result = await query(
            `INSERT INTO contestacoes_atividade (atividade_id, nome_morador, contato, mensagem)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [id, nome_morador.trim(), contato?.trim() || null, mensagem.trim()]
        );

        console.log(`📢 New contest submitted for activity ${id}`);
        res.status(201).json({
            success: true,
            message: 'Contestação enviada com sucesso!',
            contest: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating contest:', error);
        res.status(500).json({ error: 'Failed to create contest' });
    }
});

// ==================== ADMIN ROUTES ====================

// Get admin stats
router.get('/admin/stats', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
      SELECT 
        (SELECT COUNT(*) FROM diarios_de_obra) as total_diarios,
        (SELECT COUNT(*) FROM atividades_obra) as total_atividades,
        (SELECT COUNT(*) FROM atividades_obra WHERE status = 'concluido') as atividades_concluidas,
        (SELECT COUNT(*) FROM atividades_obra WHERE status = 'em_andamento') as atividades_andamento,
        (SELECT COUNT(*) FROM contestacoes_atividade WHERE status = 'pendente') as contestacoes_pendentes
    `);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Create diary (admin)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { data, observacoes, tempo } = req.body;
        const userId = (req as any).user?.id;

        if (!data) {
            return res.status(400).json({ error: 'Data é obrigatória' });
        }

        // Check if diary already exists for this date
        const existing = await query('SELECT id FROM diarios_de_obra WHERE data = $1', [data]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Já existe um diário para esta data' });
        }

        // Create diary
        const result = await query(
            `INSERT INTO diarios_de_obra (data, created_by, observacoes)
       VALUES ($1, $2, $3) RETURNING *`,
            [data, userId, observacoes?.trim() || null]
        );

        const diarioId = result.rows[0].id;

        // Add weather if provided
        if (tempo && Array.isArray(tempo)) {
            for (const t of tempo) {
                if (t.periodo && t.condicao) {
                    await query(
                        `INSERT INTO tempo_diario (diario_id, periodo, condicao, temperatura_min, temperatura_max)
             VALUES ($1, $2, $3, $4, $5)`,
                        [diarioId, t.periodo, t.condicao, t.temperatura_min || null, t.temperatura_max || null]
                    );
                }
            }
        }

        console.log(`📅 New diary created for ${data}`);
        res.status(201).json({ success: true, diary: result.rows[0] });
    } catch (error) {
        console.error('Error creating diary:', error);
        res.status(500).json({ error: 'Failed to create diary' });
    }
});

// Update diary (admin)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { observacoes, tempo } = req.body;

        const result = await query(
            `UPDATE diarios_de_obra SET observacoes = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [observacoes?.trim() || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Diary not found' });
        }

        // Update weather if provided
        if (tempo && Array.isArray(tempo)) {
            for (const t of tempo) {
                if (t.periodo && t.condicao) {
                    await query(
                        `INSERT INTO tempo_diario (diario_id, periodo, condicao, temperatura_min, temperatura_max)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (diario_id, periodo) 
             DO UPDATE SET condicao = $3, temperatura_min = $4, temperatura_max = $5`,
                        [id, t.periodo, t.condicao, t.temperatura_min || null, t.temperatura_max || null]
                    );
                }
            }
        }

        res.json({ success: true, diary: result.rows[0] });
    } catch (error) {
        console.error('Error updating diary:', error);
        res.status(500).json({ error: 'Failed to update diary' });
    }
});

// Delete diary (admin)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM diarios_de_obra WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Diary not found' });
        }

        console.log(`🗑️ Diary ${id} deleted`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting diary:', error);
        res.status(500).json({ error: 'Failed to delete diary' });
    }
});

// Add activity to diary (admin)
router.post('/:id/activities', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { descricao, local, tipo, status, observacoes, ordem } = req.body;

        // Validate
        if (!descricao || descricao.trim().length < 5) {
            return res.status(400).json({ error: 'Descrição deve ter pelo menos 5 caracteres' });
        }
        if (!local || local.trim().length < 3) {
            return res.status(400).json({ error: 'Local deve ter pelo menos 3 caracteres' });
        }
        if (!tipo) {
            return res.status(400).json({ error: 'Tipo é obrigatório' });
        }

        // Check diary exists
        const diary = await query('SELECT id FROM diarios_de_obra WHERE id = $1', [id]);
        if (diary.rows.length === 0) {
            return res.status(404).json({ error: 'Diário não encontrado' });
        }

        const result = await query(
            `INSERT INTO atividades_obra (diario_id, descricao, local, tipo, status, observacoes, ordem)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [id, descricao.trim(), local.trim(), tipo, status || 'em_andamento', observacoes?.trim() || null, ordem || 0]
        );

        console.log(`📝 Activity added to diary ${id}`);
        res.status(201).json({ success: true, activity: result.rows[0] });
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({ error: 'Failed to create activity' });
    }
});

// Update activity (admin)
router.put('/:diaryId/activities/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { descricao, local, tipo, status, observacoes, ordem } = req.body;

        const result = await query(
            `UPDATE atividades_obra SET 
        descricao = COALESCE($1, descricao),
        local = COALESCE($2, local),
        tipo = COALESCE($3, tipo),
        status = COALESCE($4, status),
        observacoes = COALESCE($5, observacoes),
        ordem = COALESCE($6, ordem),
        updated_at = NOW()
       WHERE id = $7 RETURNING *`,
            [descricao?.trim(), local?.trim(), tipo, status, observacoes?.trim(), ordem, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        res.json({ success: true, activity: result.rows[0] });
    } catch (error) {
        console.error('Error updating activity:', error);
        res.status(500).json({ error: 'Failed to update activity' });
    }
});

// Delete activity (admin)
router.delete('/:diaryId/activities/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM atividades_obra WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({ error: 'Failed to delete activity' });
    }
});

// Get all contests (admin)
router.get('/admin/contests', authenticateToken, async (req, res) => {
    try {
        const { status } = req.query;

        let queryText = `
      SELECT c.*, 
        a.descricao as atividade_descricao, 
        a.local as atividade_local,
        d.data as diario_data
      FROM contestacoes_atividade c
      JOIN atividades_obra a ON c.atividade_id = a.id
      JOIN diarios_de_obra d ON a.diario_id = d.id
    `;
        const params: any[] = [];

        if (status) {
            queryText += ` WHERE c.status = $1`;
            params.push(status);
        }

        queryText += ` ORDER BY c.created_at DESC`;

        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching contests:', error);
        res.status(500).json({ error: 'Failed to fetch contests' });
    }
});

// Update contest (admin)
router.put('/admin/contests/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resposta_admin } = req.body;
        const userId = (req as any).user?.id;

        const result = await query(
            `UPDATE contestacoes_atividade SET 
        status = COALESCE($1, status),
        resposta_admin = COALESCE($2, resposta_admin),
        respondido_por = $3,
        respondido_em = NOW(),
        updated_at = NOW()
       WHERE id = $4 RETURNING *`,
            [status, resposta_admin?.trim(), userId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        res.json({ success: true, contest: result.rows[0] });
    } catch (error) {
        console.error('Error updating contest:', error);
        res.status(500).json({ error: 'Failed to update contest' });
    }
});

export default router;
