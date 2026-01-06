import { useState, useRef, useCallback } from 'react';
import { Upload, X, Video, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { uploadService, UploadCategory, UploadProgress } from '@/services/uploadService';
import { useToast } from '@/hooks/use-toast';

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  category?: UploadCategory;
  className?: string;
  disabled?: boolean;
  maxSizeMB?: number;
}

export default function VideoUpload({
  value,
  onChange,
  onRemove,
  category = 'general',
  className,
  disabled = false,
  maxSizeMB = 100,
}: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      if (!uploadService.isValidVideoType(file)) {
        setError('Tipo de arquivo não permitido. Use: MP4, WebM, MOV, AVI ou MKV');
        return;
      }

      // Validate file size
      const maxSize = maxSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
        return;
      }

      setUploading(true);
      setProgress(0);

      try {
        const result = await uploadService.uploadVideo(
          file,
          category,
          (progressData: UploadProgress) => {
            setProgress(progressData.percentage);
          }
        );

        onChange(result.url);
        toast({ title: 'Vídeo enviado com sucesso!' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar vídeo';
        setError(message);
        toast({ title: message, variant: 'destructive' });
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [category, maxSizeMB, onChange, toast]
  );

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      await handleUpload(file);
    },
    [handleUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || uploading) return;

      handleFileSelect(e.dataTransfer.files);
    },
    [disabled, uploading, handleFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !uploading) {
        setIsDragging(true);
      }
    },
    [disabled, uploading]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  const handleRemove = useCallback(() => {
    onChange('');
    onRemove?.();
  }, [onChange, onRemove]);

  // Check if the URL is a YouTube URL
  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'aspect-video relative bg-muted rounded-lg border-2 border-dashed transition-colors overflow-hidden',
          isDragging ? 'border-primary bg-primary/5' : 'border-border',
          !disabled && !uploading && 'cursor-pointer hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled || uploading}
        />

        {value ? (
          <>
            {isYouTubeUrl(value) ? (
              <iframe
                src={getYouTubeEmbedUrl(value) || ''}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={value}
                className="w-full h-full object-cover"
                controls
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <Progress value={progress} className="w-full max-w-[200px] h-2" />
            <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
            <p className="text-xs text-muted-foreground mt-1">Enviando vídeo...</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Video className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              {isDragging ? 'Solte o vídeo aqui' : 'Arraste um vídeo ou clique'}
            </p>
            <p className="text-xs text-muted-foreground mb-1">
              Formatos: MP4, WebM, MOV, AVI, MKV
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Máximo: {maxSizeMB}MB
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Vídeo
            </Button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
