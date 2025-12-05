import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { upload, uploadErrorHandler } from '../middleware/upload';
import { authMiddleware, AuthRequest, requirePermission } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

// Ensure upload directories exist
const categories = ['news', 'site', 'courts', 'general'];
categories.forEach((category) => {
  const dir = path.join(__dirname, '../../uploads', category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Upload single image
router.post(
  '/image',
  authMiddleware,
  upload.single('image'),
  uploadErrorHandler,
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const category = req.query.category as string || 'general';
      const relativePath = `/uploads/${category}/${req.file.filename}`;
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

      // Save file info to database
      await query(
        `INSERT INTO uploaded_files (filename, original_name, mimetype, size, path, category, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.file.filename,
          req.file.originalname,
          req.file.mimetype,
          req.file.size,
          relativePath,
          category,
          req.user?.id,
        ]
      );

      res.json({
        success: true,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: relativePath,
        url: `${baseUrl}${relativePath}`,
        size: req.file.size,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
    }
  }
);

// Upload multiple images
router.post(
  '/images',
  authMiddleware,
  upload.array('images', 10),
  uploadErrorHandler,
  async (req: AuthRequest, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const category = req.query.category as string || 'general';
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const relativePath = `/uploads/${category}/${file.filename}`;

          await query(
            `INSERT INTO uploaded_files (filename, original_name, mimetype, size, path, category, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              file.filename,
              file.originalname,
              file.mimetype,
              file.size,
              relativePath,
              category,
              req.user?.id,
            ]
          );

          return {
            filename: file.filename,
            originalName: file.originalname,
            path: relativePath,
            url: `${baseUrl}${relativePath}`,
            size: file.size,
          };
        })
      );

      res.json({
        success: true,
        files: uploadedFiles,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Erro ao fazer upload dos arquivos' });
    }
  }
);

// Delete image
router.delete('/:filename', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { filename } = req.params;
    const category = req.query.category as string || 'general';

    // Find file in database
    const result = await query(
      'SELECT * FROM uploaded_files WHERE filename = $1 AND category = $2',
      [filename, category]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Delete from filesystem
    const filePath = path.join(__dirname, '../../uploads', category, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await query('DELETE FROM uploaded_files WHERE filename = $1', [filename]);

    res.json({ success: true, message: 'Arquivo excluído com sucesso' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Erro ao excluir arquivo' });
  }
});

// List uploaded files
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const category = req.query.category as string;
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

    let queryText = 'SELECT * FROM uploaded_files';
    const params: string[] = [];

    if (category) {
      queryText += ' WHERE category = $1';
      params.push(category);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);

    const files = result.rows.map((file) => ({
      ...file,
      url: `${baseUrl}${file.path}`,
    }));

    res.json(files);
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Erro ao listar arquivos' });
  }
});

export default router;
