import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl, cn } from '@/lib/utils';

interface GallerySlideshowProps {
  photos: any[];
  albumTitle: string;
  onClose: () => void;
}

const ANIMATION_VARIANTS = [
  // 0: Zoom In Fade
  {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 },
  },
  // 1: Slide Left with Blur
  {
    initial: { opacity: 0, x: 100, filter: 'blur(10px)' },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, x: -100, filter: 'blur(10px)' },
  },
  // 2: Zoom Out Fade
  {
    initial: { opacity: 0, scale: 1.2 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },
  // 3: Slide Up with Blur
  {
    initial: { opacity: 0, y: 100, filter: 'blur(10px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -100, filter: 'blur(10px)' },
  },
  // 4: Subtle Rotate & Scale
  {
    initial: { opacity: 0, rotate: 5, scale: 0.9 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: -5, scale: 1.1 },
  },
];

const WatermarkOverlay = ({ title, size = "normal" }: { title: string, size?: "normal" | "large" }) => {
  return (
    <div className={cn(
      "absolute pointer-events-none select-none text-white z-10 w-full flex flex-col items-center",
      size === "large" ? "bottom-20" : "bottom-6"
    )} style={{ opacity: 0.8 }}>
      <p className={cn(
        "font-black uppercase tracking-tighter text-white whitespace-nowrap text-center leading-none mb-2",
        size === "large" ? "text-6xl md:text-8xl" : "text-[14px] md:text-[18px]"
      )}>
        {title}
      </p>
      <div className={cn(
        "flex items-center",
        size === "large" ? "text-2xl md:text-3xl" : "text-[8px] md:text-[10px]"
      )}>
        <span className="text-white/40 font-light tracking-widest uppercase">Ministério</span>
        <span className="text-white font-black tracking-widest ml-2 uppercase">Profecia</span>
      </div>
    </div>
  );
};

export const GallerySlideshow: React.FC<GallerySlideshowProps> = ({
  photos,
  albumTitle,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 2500); // Hide after 2.5s of inactivity
  }, []);

  useEffect(() => {
    // Initial hide
    hideControlsTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    return () => {
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 4000); // 4 seconds per slide

    return () => clearInterval(timer);
  }, [isPlaying, photos.length]);

  useEffect(() => {
    // Hide body and html scrollbar
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Entrar em tela cheia ao abrir
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }

    // Se o usuário apertar ESC, sair do tela cheia e fechar o slideshow
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onClose();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      
      // Restore scrollbars
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.warn(err));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const currentVariant = ANIMATION_VARIANTS[currentIndex % ANIMATION_VARIANTS.length];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] bg-black/100 flex flex-col items-center justify-center overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
    >
      {/* Top Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 pointer-events-none"
          >
            <div>
              <h2 className="text-white text-sm font-black uppercase tracking-tight leading-none mb-1">{albumTitle}</h2>
              <p className="text-[#a855f7] text-[9px] font-bold tracking-[0.2em] uppercase">
                Slide {currentIndex + 1} de {photos.length}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors pointer-events-auto backdrop-blur-md border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            variants={currentVariant}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <WatermarkOverlay title={albumTitle} size="normal" />
              <img 
                src={getImageUrl(photos[currentIndex])}
                alt={`Slide ${currentIndex + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 flex items-center gap-5 z-50 bg-[#161616]/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/5 pointer-events-auto"
          >
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
