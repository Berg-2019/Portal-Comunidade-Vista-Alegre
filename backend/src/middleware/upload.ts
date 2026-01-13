import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Tipos de arquivo permitidos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
const ALLOWED_MEDIA_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Limites de tamanho
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB para imagens
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB para vídeos
const MAX_MEDIA_SIZE = 100 * 1024 * 1024; // 100MB geral (para mídia mista)

// Função para criar diretório se não existir
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage para imagens
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.query.category as string || 'general';
    const uploadPath = path.join(__dirname, '../../uploads', category);
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0];
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${uniqueId}${ext}`);
  },
});

// Storage para vídeos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.query.category as string || 'general';
    const uploadPath = path.join(__dirname, '../../uploads/videos', category);
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0];
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${uniqueId}${ext}`);
  },
});

// Storage para mídia mista (imagens e vídeos)
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.query.category as string || 'general';
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);
    const subFolder = isVideo ? 'videos' : '';
    const uploadPath = path.join(__dirname, '../../uploads', subFolder, category);
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0];
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${uniqueId}${ext}`);
  },
});

// Filtro para imagens
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use: JPG, PNG, WebP ou GIF'));
  }
};

// Filtro para vídeos
const videoFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use: MP4, WebM, MOV, AVI ou MKV'));
  }
};

// Filtro para mídia mista
const mediaFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MEDIA_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use imagens (JPG, PNG, WebP, GIF) ou vídeos (MP4, WebM, MOV, AVI, MKV)'));
  }
};

// Upload de imagens (compatibilidade com código existente)
export const upload = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
});

// Upload de vídeos
export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE,
  },
});

// Upload de mídia mista
export const uploadMedia = multer({
  storage: mediaStorage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: MAX_MEDIA_SIZE,
  },
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadVideoSingle = (fieldName: string) => uploadVideo.single(fieldName);
export const uploadMediaSingle = (fieldName: string) => uploadMedia.single(fieldName);

// Storage específico para businesses (sempre salva em 'businesses' folder)
const businessStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/businesses');
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueId = uuidv4().split('-')[0];
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${uniqueId}${ext}`);
  },
});

const businessUpload = multer({
  storage: businessStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
});

export const uploadBusinessSingle = (fieldName: string) => businessUpload.single(fieldName);

// Handler de erros para upload de imagens
export const uploadErrorHandler = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo para imagens: 10MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
};

// Handler de erros para upload de vídeos
export const uploadVideoErrorHandler = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo para vídeos: 100MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
};

// Handler de erros para upload de mídia mista
export const uploadMediaErrorHandler = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo: 100MB para vídeos, 10MB para imagens' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  
  next();
};

// Exportar constantes para uso em outros módulos
export const UPLOAD_LIMITS = {
  IMAGE_MAX_SIZE: MAX_IMAGE_SIZE,
  VIDEO_MAX_SIZE: MAX_VIDEO_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_MEDIA_TYPES,
};
