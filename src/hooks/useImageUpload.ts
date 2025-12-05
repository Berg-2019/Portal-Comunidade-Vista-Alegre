import { useState, useCallback } from 'react';
import { uploadService, UploadCategory, UploadedFile, UploadProgress } from '@/services/uploadService';

interface UseImageUploadOptions {
  category?: UploadCategory;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  onSuccess?: (file: UploadedFile) => void;
  onError?: (error: string) => void;
}

interface UseImageUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadedFile: UploadedFile | null;
  upload: (file: File) => Promise<UploadedFile | null>;
  uploadMultiple: (files: File[]) => Promise<UploadedFile[]>;
  remove: (filename: string) => Promise<boolean>;
  reset: () => void;
  validate: (file: File) => string | null;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const {
    category = 'general',
    maxSize = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    onSuccess,
    onError,
  } = options;

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const validate = useCallback(
    (file: File): string | null => {
      if (!allowedTypes.includes(file.type)) {
        return 'Tipo de arquivo não permitido. Use: JPG, PNG, WebP ou GIF';
      }

      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return `Arquivo muito grande. Máximo: ${maxSizeMB}MB`;
      }

      return null;
    },
    [allowedTypes, maxSize]
  );

  const handleProgress = useCallback((progressData: UploadProgress) => {
    setProgress(progressData.percentage);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<UploadedFile | null> => {
      const validationError = validate(file);
      if (validationError) {
        setError(validationError);
        onError?.(validationError);
        return null;
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        const result = await uploadService.uploadImage(file, category, handleProgress);
        setUploadedFile(result);
        setProgress(100);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro no upload';
        setError(errorMessage);
        onError?.(errorMessage);
        return null;
      } finally {
        setUploading(false);
      }
    },
    [category, validate, handleProgress, onSuccess, onError]
  );

  const uploadMultiple = useCallback(
    async (files: File[]): Promise<UploadedFile[]> => {
      for (const file of files) {
        const validationError = validate(file);
        if (validationError) {
          setError(validationError);
          onError?.(validationError);
          return [];
        }
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        const results = await uploadService.uploadMultipleImages(files, category, handleProgress);
        setProgress(100);
        return results;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro no upload';
        setError(errorMessage);
        onError?.(errorMessage);
        return [];
      } finally {
        setUploading(false);
      }
    },
    [category, validate, handleProgress, onError]
  );

  const remove = useCallback(
    async (filename: string): Promise<boolean> => {
      try {
        await uploadService.deleteImage(filename, category);
        setUploadedFile(null);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir';
        setError(errorMessage);
        onError?.(errorMessage);
        return false;
      }
    },
    [category, onError]
  );

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedFile(null);
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadedFile,
    upload,
    uploadMultiple,
    remove,
    reset,
    validate,
  };
}

export default useImageUpload;
