import React from 'react';
import { useRadio } from '@/contexts/RadioContext';
import { Play, Pause, SkipForward, SkipBack, Volume2, X, Music2, Radio as RadioIcon, ChevronUp, ChevronDown, Shuffle, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function GlobalPlayer() {
  const {
    isPlayerOpen, isPlayerMinimized, setIsPlayerMinimized,
    isLiveMode, currentTrack, isPlaying, togglePlay, playNext, playPrev,
    queue, progress, duration, handleSeek, volume, setVolume, isMuted, setIsMuted, settings, hasAccess,
    isShuffle, isRepeat, setIsShuffle, setIsRepeat
  } = useRadio();

  if (!hasAccess || (!isPlayerOpen && !isPlayerMinimized)) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none transition-transform duration-500 ease-in-out text-white" style={{ transform: isPlayerMinimized ? 'translateY(80%)' : 'translateY(0)' }}>
      {/* Toggle button when minimized */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-auto">
         <button 
           onClick={() => setIsPlayerMinimized(!isPlayerMinimized)} 
           className="w-12 h-10 bg-black/80 backdrop-blur-md rounded-t-2xl border-t border-l border-r border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-black transition-all"
         >
           {isPlayerMinimized ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
         </button>
      </div>

      {/* Player Bar Background */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-black/90 backdrop-blur-3xl border-t border-white/10 pointer-events-auto" />

      {/* Progress Bar (Absolute positioning over the bar, full width) */}
      {!isLiveMode && currentTrack && (
        <div className="absolute bottom-20 left-0 right-0 -mb-[2px] h-1 group cursor-pointer flex flex-col items-center w-full z-50 pointer-events-auto">
          <input 
            type="range" 
            min={0} 
            max={duration || 100} 
            value={progress} 
            onChange={handleSeek}
            className="w-full absolute opacity-0 cursor-pointer z-10 h-3 -top-1"
          />
          <div className="h-1 bg-white/20 w-full overflow-hidden transition-all group-hover:h-1.5">
            <div 
              className="h-full bg-gradient-to-r from-[#BF76FF] to-[#FF4400] relative"
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex items-center justify-between relative pointer-events-auto h-20 px-4">
        
        {/* Left: Track Info */}
        <div className="flex items-center gap-4 w-1/3 min-w-0">
          {isLiveMode ? (
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#BF76FF] to-[#FF4400] flex items-center justify-center shrink-0">
               <RadioIcon className="w-6 h-6 text-white" />
             </div>
          ) : currentTrack ? (
            <img 
              src={currentTrack.isVignette ? currentTrack.thumbnail || "/placeholder.jpg" : `https://img.youtube.com/vi/${currentTrack.youtubeId}/default.jpg`} 
              alt="cover" 
              className="w-12 h-12 rounded-xl object-cover shrink-0 bg-white/5 border border-white/10"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
              <Music2 className="w-5 h-5 opacity-40" />
            </div>
          )}
          <div className="min-w-0 truncate text-white">
             <p className="text-sm font-bold truncate text-white">
               {isLiveMode ? (settings?.radioTitle || "Rádio Ao Vivo") : currentTrack?.title || "Nenhuma música tocando"}
             </p>
             <p className="text-[10px] uppercase tracking-widest opacity-80 truncate mt-0.5 text-white/80">
               {isLiveMode ? "Transmissão Oficial" : currentTrack?.isVignette ? "Vinheta" : currentTrack?.artist || currentTrack?.description || "Selecione algo para ouvir"}
             </p>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex flex-col items-center justify-center w-1/3">
           <div className="flex items-center justify-center gap-4 sm:gap-6 h-12">
              {!isLiveMode && (
                <button onClick={() => setIsShuffle(!isShuffle)} className={`hidden sm:block p-2 transition-colors ${isShuffle ? 'text-[#BF76FF]' : 'text-white/40 hover:text-white'}`}>
                  <Shuffle className="w-4 h-4" />
                </button>
              )}

              {!isLiveMode && (
                <button onClick={playPrev} className="text-white/50 hover:text-white transition-colors disabled:opacity-30 p-2" disabled={queue.length <= 1}>
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>
              )}
              
              <button 
                onClick={togglePlay}
                className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current shrink-0" /> : <Play className="w-5 h-5 fill-current ml-1 shrink-0" />}
              </button>

              {!isLiveMode && (
                <button onClick={playNext} className="text-white/50 hover:text-white transition-colors disabled:opacity-30 p-2" disabled={queue.length <= 1}>
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              )}

              {!isLiveMode && (
                <button onClick={() => setIsRepeat(!isRepeat)} className={`hidden sm:block p-2 transition-colors ${isRepeat ? 'text-[#BF76FF]' : 'text-white/40 hover:text-white'}`}>
                  <Repeat className="w-4 h-4" />
                </button>
              )}
           </div>
           
           {!isLiveMode && currentTrack && (
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none hidden md:flex items-center gap-3 text-[10px] font-mono opacity-50 w-full px-2 max-w-sm mx-auto opacity-0 md:opacity-100" style={{ transform: 'translateY(18px)' }}>
                <span>{formatTime(progress)}</span>
                <div className="flex-1" />
                <span>{formatTime(duration)}</span>
              </div>
           )}
        </div>

        {/* Right: Volume & Actions */}
        <div className="flex items-center justify-end gap-4 w-1/3">
          <button onClick={() => setIsMuted(!isMuted)} className="text-white/50 hover:text-white transition-colors p-2 hidden sm:block">
            {isMuted || volume === 0 ? <X className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="w-24 h-1 bg-white/10 rounded-full relative group cursor-pointer hidden sm:block">
             <input 
               type="range" 
               min={0} max={1} step={0.01}
               value={isMuted ? 0 : volume}
               onChange={(e) => {
                 setVolume(parseFloat(e.target.value));
                 if (isMuted) setIsMuted(false);
               }}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
             />
             <div className="h-full bg-white rounded-full pointer-events-none" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
