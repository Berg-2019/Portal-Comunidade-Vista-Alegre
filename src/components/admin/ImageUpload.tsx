import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useImageUpload } from '@/hooks/useImageUpload';
import { UploadCategory } from '@/services/uploadService';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  category?: UploadCategory;
  aspectRatio?: 'video' | 'square' | 'auto';
  recommendedSize?: string;
  className?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  category = 'general',
  aspectRatio = 'video',
  recommendedSize,
  className,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploading, progress, error, upload, validate } = useImageUpload({
    category,
    onSuccess: (file) => {
      onChange(file.url);
    },
  });

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      
      const file = files[0];
      await upload(file);
    },
    [upload]
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  }, [disabled, uploading]);

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

  const aspectClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    auto: 'min-h-[200px]',
  }[aspectRatio];

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          aspectClass,
          'relative bg-muted rounded-lg border-2 border-dashed transition-colors overflow-hidden',
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
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled || uploading}
        />

        {value ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
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
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              {isDragging ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique'}
            </p>
            {recommendedSize && (
              <p className="text-xs text-muted-foreground mb-3">
                Recomendado: {recommendedSize}
              </p>
            )}
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
              Selecionar
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
