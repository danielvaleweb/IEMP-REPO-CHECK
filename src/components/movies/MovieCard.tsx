import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Plus, 
  Check, 
  Heart, 
  ChevronDown,
  Camera,
  ThumbsUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  item: any;
  type: 'video' | 'event';
  onClick: () => void;
  idx: number;
  onAddToList?: (e: React.MouseEvent, item: any) => void;
  onFavorite?: (e: React.MouseEvent, item: any) => void;
  onShowSimilar?: (item: any) => void;
  isInList?: boolean;
  isFavorited?: boolean;
  showEffects?: boolean;
}

export const MovieCard = ({ 
  item, 
  type, 
  onClick, 
  idx, 
  onAddToList, 
  onFavorite, 
  onShowSimilar,
  isInList, 
  isFavorited,
  showEffects = true
}: MovieCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!showEffects || type === 'event') return;
    hoverTimerRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 2000); // Trigger preview after 2 seconds of hover as requested.
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setShowPreview(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const isVideo = type === 'video';
  const displayImage = type === 'event' 
    ? ((item.gallery && item.gallery.length > 0) ? item.gallery[0] : item.image) 
    : item.thumbnail;

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const ytId = isVideo ? getYoutubeId(item.url || item.link) : null;

  const cardContent = (
    <div 
      className={cn(
        "group cursor-pointer bg-[#141414] rounded-md shadow-2xl relative w-full overflow-hidden transition-all duration-300",
        !showEffects && "hover:opacity-80"
      )}
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={displayImage} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        {/* Play icon removed on hover as requested */}
      </div>
      {!showEffects && (
        <div className="p-2">
          <h3 className="text-white text-xs font-bold truncate">{item.title}</h3>
        </div>
      )}
    </div>
  );

  if (!showEffects || type === 'event') {
    return (
      <div className="relative z-10 w-full animate-in fade-in duration-500">
        {cardContent}
      </div>
    );
  }

  return (
    <div 
      className={cn("relative w-full", isHovered ? "z-[100]" : "z-10")}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Base Card (Static) - Mantém o espaço reservado no grid */}
      <div className="w-full aspect-video rounded-md bg-[#141414] overflow-hidden shadow-lg border border-white/5">
        <img 
          src={displayImage} 
          alt={item.title} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Hover Card (Absolute) - Expande para fora sem empurrar os outros */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 0 }}
            animate={{ scale: 1.15, opacity: 1, y: -40 }}
            exit={{ scale: 0.9, opacity: 0, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-0 left-[-7.5%] w-[115%] z-[500] bg-[#181818] rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden cursor-pointer flex flex-col"
            onClick={onClick}
          >
            <div className="relative aspect-video bg-black">
              {showPreview && ytId ? (
                <div className="absolute inset-0 z-10">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
                    className="w-full h-full border-none pointer-events-none scale-105"
                    allow="autoplay"
                  />
                </div>
              ) : (
                <img 
                  src={displayImage} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            <div className="p-4 flex flex-col gap-3 min-h-[140px] bg-[#181818]">
              <div className="flex items-center gap-2">
                <button 
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg shrink-0"
                  onClick={(e) => { e.stopPropagation(); onClick(); }}
                >
                  <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                </button>
                <button 
                  className={cn(
                    "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                    isInList ? "border-green-500 bg-green-500/20" : "border-gray-500 hover:border-white"
                  )}
                  onClick={(e) => { e.stopPropagation(); onAddToList?.(e, item); }}
                  title={isInList ? "Remover da minha lista" : "Adicionar à minha lista"}
                >
                  {isInList ? <Check className="w-5 h-5 text-green-500" /> : <Plus className="w-5 h-5 text-white" />}
                </button>
                <button 
                  className={cn(
                    "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                    isFavorited ? "border-red-500 bg-red-500/20" : "border-gray-500 hover:border-white"
                  )}
                  onClick={(e) => { e.stopPropagation(); onFavorite?.(e, item); }}
                  title={isFavorited ? "Remover dos favoritos" : "Favoritar"}
                >
                  <Heart className={cn("w-5 h-5", isFavorited ? "fill-red-500 text-red-500" : "text-white")} />
                </button>
                <button 
                  className="w-9 h-9 rounded-full border-2 border-gray-500 flex items-center justify-center hover:border-white transition-colors ml-auto group/expand shrink-0"
                  onClick={(e) => { e.stopPropagation(); onShowSimilar?.(item); }}
                >
                  <ChevronDown className="w-5 h-5 text-white group-hover/expand:translate-y-0.5 transition-transform" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-white font-bold text-sm tracking-tight line-clamp-1">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-green-500 font-black uppercase tracking-tighter">98% Relevante</span>
                  {item.tags && item.tags.length > 0 ? (
                    item.tags.slice(0, 2).map((tag: string, idx: number) => (
                      <span key={idx} className="text-[10px] text-[#BF76FF] bg-[#BF76FF]/10 border border-[#BF76FF]/20 px-1.5 py-0.5 rounded uppercase font-bold">{tag}</span>
                    ))
                  ) : (
                    <span className="text-[10px] text-gray-400 border border-white/20 px-1.5 py-0.5 rounded uppercase font-bold">{item.badge || (type === 'event' ? 'Evento' : 'Série')}</span>
                  )}
                  <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">Classificação Livre</span>
                </div>
                {item.description && (
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-snug mt-1 opacity-80">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
