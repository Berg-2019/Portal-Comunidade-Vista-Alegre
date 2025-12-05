import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, Instagram, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { businesses } from "@/data/mockData";

interface SponsorBusiness {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  whatsapp?: string;
  instagramUrl?: string;
  location?: string;
}

export default function SponsorCarousel() {
  const sponsors = businesses.filter((b) => b.approved && b.isSponsor) as SponsorBusiness[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const itemsPerView = {
    mobile: 1,
    tablet: 2,
    desktop: 4,
  };

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(sponsors.length - itemsPerView.desktop + 1, 1));
  }, [sponsors.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(sponsors.length - itemsPerView.desktop, 0) : prev - 1
    );
  }, [sponsors.length]);

  useEffect(() => {
    if (!isAutoPlaying || sponsors.length <= itemsPerView.desktop) return;
    
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, sponsors.length]);

  if (sponsors.length === 0) return null;

  return (
    <section className="py-12 bg-card border-t border-b border-border">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="font-heading text-xl md:text-2xl font-bold mb-2">
            Apoiadores do Portal
          </h2>
          <p className="text-sm text-muted-foreground">
            Conheça os comércios que apoiam nossa comunidade
          </p>
        </div>

        <div 
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Navigation Buttons */}
          {sponsors.length > itemsPerView.desktop && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 hidden md:flex shadow-lg bg-card"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 hidden md:flex shadow-lg bg-card"
                onClick={nextSlide}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Carousel Container */}
          <div className="overflow-hidden mx-0 md:mx-8">
            <div
              className="flex transition-transform duration-500 ease-out gap-4"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView.desktop + 1.5)}%)`,
              }}
            >
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4 px-2"
                >
                  <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-card-hover transition-all duration-300 group">
                    {/* Image */}
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {sponsor.imageUrl ? (
                        <img
                          src={sponsor.imageUrl}
                          alt={sponsor.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <span className="font-heading text-2xl font-bold text-primary/40">
                            {sponsor.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                        {sponsor.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {sponsor.description}
                      </p>

                      {/* Location */}
                      {sponsor.location && (
                        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="line-clamp-1">{sponsor.location}</span>
                        </p>
                      )}

                      {/* Links */}
                      <div className="flex items-center gap-2">
                        {sponsor.whatsapp && (
                          <a
                            href={`https://wa.me/${sponsor.whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-success hover:underline"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        )}
                        {sponsor.instagramUrl && (
                          <a
                            href={sponsor.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-pink-500 hover:underline"
                          >
                            <Instagram className="h-3.5 w-3.5" />
                            Instagram
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Navigation Dots */}
          {sponsors.length > 1 && (
            <div className="flex justify-center gap-2 mt-4 md:hidden">
              {sponsors.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    currentIndex === index ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
