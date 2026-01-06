import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { upload, uploadVideo, uploadErrorHandler, uploadVideoErrorHandler, UPLOAD_LIMITS } from '../middleware/upload';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

const router = Router();

// Ensure upload directories exist
const categories = ['news', 'site', 'courts', 'general'];
categories.forEach((category) => {
  // Diretórios para imagens
  const imageDir = path.join(__dirname, '../../uploads', category);
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }
  
  // Diretórios para vídeos
  const videoDir = path.join(__dirname, '../../uploads/videos', category);
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }
});

// Upload single image
router.post(
  '/image',
  authMiddleware,
  upload.single('image'),
  uploadErrorHandler,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
  res.status(400).json({ error: 'Nenhum arquivo enviado' });
  return;
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
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
         res.status(400).json({ error: 'Nenhum arquivo enviado' });
         return;
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

// Upload single video
router.post(
  '/video',
  authMiddleware,
  uploadVideo.single('video'),
  uploadVideoErrorHandler,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return;
      }

      const category = req.query.category as string || 'general';
      const relativePath = `/uploads/videos/${category}/${req.file.filename}`;
      const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

      // Save file info to database
      await query(
        `INSERT INTO uploaded_files (filename, original_name, mimetype, size, path, category, uploaded_by, file_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          req.file.filename,
          req.file.originalname,
          req.file.mimetype,
          req.file.size,
          relativePath,
          category,
          req.user?.id,
          'video',
        ]
      );

      res.json({
        success: true,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: relativePath,
        url: `${baseUrl}${relativePath}`,
        size: req.file.size,
        type: 'video',
      });
    } catch (error) {
      console.error('Video upload error:', error);
      res.status(500).json({ error: 'Erro ao fazer upload do vídeo' });
    }
  }
);

// Delete file (image or video)
router.delete('/:filename', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    const category = req.query.category as string || 'general';
    const fileType = req.query.type as string || 'image';

    // Find file in database
    const result = await query(
      'SELECT * FROM uploaded_files WHERE filename = $1',
      [filename]
    );

    if (result.rows.length === 0) {
       res.status(404).json({ error: 'Arquivo não encontrado' });
       return;
    }

    const fileRecord = result.rows[0];

    // Delete from filesystem
    let filePath: string;
    if (fileRecord.file_type === 'video' || fileType === 'video') {
      filePath = path.join(__dirname, '../../uploads/videos', category, filename);
    } else {
      filePath = path.join(__dirname, '../../uploads', category, filename);
    }
    
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
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const category = req.query.category as string;
    const fileType = req.query.type as string;
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

    let queryText = 'SELECT * FROM uploaded_files';
    const params: string[] = [];
    const conditions: string[] = [];

    if (category) {
      conditions.push(`category = $${params.length + 1}`);
      params.push(category);
    }

    if (fileType) {
      conditions.push(`file_type = $${params.length + 1}`);
      params.push(fileType);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
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

// Get upload limits info
router.get('/limits', async (req, res: Response): Promise<void> => {
  res.json({
    image: {
      maxSize: UPLOAD_LIMITS.IMAGE_MAX_SIZE,
      maxSizeMB: UPLOAD_LIMITS.IMAGE_MAX_SIZE / (1024 * 1024),
      allowedTypes: UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES,
    },
    video: {
      maxSize: UPLOAD_LIMITS.VIDEO_MAX_SIZE,
      maxSizeMB: UPLOAD_LIMITS.VIDEO_MAX_SIZE / (1024 * 1024),
      allowedTypes: UPLOAD_LIMITS.ALLOWED_VIDEO_TYPES,
    },
  });
});

export default router;
