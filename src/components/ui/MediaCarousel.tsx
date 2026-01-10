import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaCarouselProps {
  imageUrl?: string;
  videoUrl?: string;
  title: string;
  className?: string;
}

export default function MediaCarousel({ imageUrl, videoUrl, title, className }: MediaCarouselProps) {
  const [activeSlide, setActiveSlide] = useState<'image' | 'video'>('image');
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hasImage = !!imageUrl;
  const hasVideo = !!videoUrl;
  const isYouTubeVideo = hasVideo && (videoUrl.includes('youtube') || videoUrl.includes('youtu.be'));
  const hasMultipleSlides = hasImage && hasVideo;

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  // Go to next slide
  const nextSlide = useCallback(() => {
    if (!hasMultipleSlides) return;
    setActiveSlide(prev => prev === 'image' ? 'video' : 'image');
  }, [hasMultipleSlides]);

  // Go to previous slide
  const prevSlide = useCallback(() => {
    if (!hasMultipleSlides) return;
    setActiveSlide(prev => prev === 'image' ? 'video' : 'image');
  }, [hasMultipleSlides]);

  // Start image timer (5 seconds)
  const startImageTimer = useCallback(() => {
    if (!hasMultipleSlides || isPaused) return;
    
    timerRef.current = setTimeout(() => {
      setActiveSlide('video');
    }, 5000);
  }, [hasMultipleSlides, isPaused]);

  // Clear timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Handle video end - return to image
  const handleVideoEnded = useCallback(() => {
    setIsVideoPlaying(false);
    if (hasMultipleSlides) {
      setActiveSlide('image');
    }
  }, [hasMultipleSlides]);

  // Effect for image auto-advance
  useEffect(() => {
    if (activeSlide === 'image' && hasMultipleSlides && !isPaused) {
      startImageTimer();
    }
    return () => clearTimer();
  }, [activeSlide, hasMultipleSlides, isPaused, startImageTimer, clearTimer]);

  // Effect for video auto-play
  useEffect(() => {
    if (activeSlide === 'video' && videoRef.current && !isYouTubeVideo) {
      videoRef.current.play().catch(() => {});
      setIsVideoPlaying(true);
    }
  }, [activeSlide, isYouTubeVideo]);

  // If only image or only video, show simple view
  if (!hasMultipleSlides) {
    if (hasImage) {
      return (
        <div className={cn("rounded-xl overflow-hidden", className)}>
          <img src={imageUrl} alt={title} className="w-full h-auto max-h-[600px] object-contain" />
        </div>
      );
    }
    if (hasVideo) {
      if (isYouTubeVideo) {
        const videoId = getYouTubeId(videoUrl);
        return (
          <div className={cn("rounded-xl overflow-hidden aspect-video", className)}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
      return (
        <div className={cn("rounded-xl overflow-hidden", className)}>
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-auto max-h-[600px]"
          />
        </div>
      );
    }
    return null;
  }

  // Carousel with both image and video
  return (
    <div className={cn("relative rounded-xl overflow-hidden group", className)}>
      {/* Slides Container - uses aspect-video for consistent sizing */}
      <div className="relative aspect-video bg-black">
        {/* Image Slide */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500 flex items-center justify-center",
            activeSlide === 'image' ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
        >
          <img src={imageUrl} alt={title} className="max-w-full max-h-full object-contain" />
        </div>

        {/* Video Slide */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500 flex items-center justify-center",
            activeSlide === 'video' ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
        >
          {isYouTubeVideo ? (
            <iframe
              src={activeSlide === 'video' ? `https://www.youtube.com/embed/${getYouTubeId(videoUrl!)}?autoplay=1` : ''}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-w-full max-h-full"
              onEnded={handleVideoEnded}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              controls
              playsInline
            />
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={prevSlide}
        aria-label="Slide anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={nextSlide}
        aria-label="Próximo slide"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Pause/Play Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-2 right-2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setIsPaused(!isPaused)}
        aria-label={isPaused ? "Continuar rotação" : "Pausar rotação"}
      >
        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </Button>

      {/* Slide Indicators */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        <button
          className={cn(
            "w-2 h-2 rounded-full transition-all",
            activeSlide === 'image' ? 'bg-white w-4' : 'bg-white/50'
          )}
          onClick={() => setActiveSlide('image')}
          aria-label="Ver imagem"
        />
        <button
          className={cn(
            "w-2 h-2 rounded-full transition-all",
            activeSlide === 'video' ? 'bg-white w-4' : 'bg-white/50'
          )}
          onClick={() => setActiveSlide('video')}
          aria-label="Ver vídeo"
        />
      </div>

      {/* Progress Bar for Image (when showing image) */}
      {activeSlide === 'image' && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-20">
          <div 
            className="h-full bg-primary animate-progress-bar"
            style={{ animationDuration: '5s' }}
          />
        </div>
      )}
    </div>
  );
}
