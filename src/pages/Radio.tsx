import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  Radio as RadioIcon, 
  Volume2, 
  Music,
  Share2,
  Heart,
  Clock,
  Radio,
  Cast,
  SkipForward,
  SkipBack,
  Youtube,
  ListMusic
} from "lucide-react";
import ReactPlayer from "react-player";
const Player = ReactPlayer as any;
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";

export default function RadioPage() {
  const isDarkMode = true; // Radio page is dark themed by default
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [config, setConfig] = useState<any>(null);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
    });

    const unsubPlaylist = onSnapshot(query(collection(db, "radio-playlist"), orderBy("order", "asc")), (snap) => {
      const tracks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPlaylist(tracks);
    });

    return () => {
      unsubConfig();
      unsubPlaylist();
    };
  }, []);

  const currentTrack = useMemo(() => playlist[currentTrackIndex] || null, [playlist, currentTrackIndex]);

  const handleNext = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  };

  const handlePrevious = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const currentVideoUrl = useMemo(() => {
    if (!currentTrack?.youtubeId) return null;
    return `https://www.youtube.com/watch?v=${currentTrack.youtubeId}`;
  }, [currentTrack]);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 md:px-12 flex flex-col items-center justify-center relative overflow-hidden font-['Inter',_sans-serif]">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#BF76FF]/10 via-black to-black" />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#BF76FF]/10 rounded-full blur-[120px] transition-all duration-1000" 
          style={{ opacity: isPlaying ? 0.3 : 0.1, scale: isPlaying ? 1.2 : 0.8 }}
        />
        
        {/* Dynamic Wave Background */}
        <div className="absolute bottom-0 left-0 right-0 h-96 opacity-20 pointer-events-none">
          <svg className="w-full h-full" overflow="visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 50 Q 25 30 50 50 T 100 50 V 100 H 0 Z" fill="url(#gradient)" className={isMuted || !isPlaying ? "" : "animate-wave"} />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="#BF76FF" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="max-w-5xl w-full relative z-10 flex flex-col items-center gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
          
          {/* Main Player Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 md:p-12 shadow-2xl overflow-hidden relative group"
          >
            {/* Hidden Player Engine */}
            <div className="absolute -top-10 -left-10 w-1 h-1 opacity-[0.01] pointer-events-none overflow-hidden">
              {currentVideoUrl && (
                <Player
                  key={currentVideoUrl}
                  ref={playerRef}
                  url={currentVideoUrl}
                  playing={isPlaying}
                  volume={volume}
                  muted={isMuted}
                  onReady={() => console.log('Radio: Player Ready')}
                  onStart={() => {
                    console.log('Radio: Player Started');
                    // Force volume refresh on start
                    if (playerRef.current) {
                      const internal = playerRef.current.getInternalPlayer();
                      if (internal && typeof internal.setVolume === 'function') {
                        internal.setVolume(volume * 100);
                      }
                    }
                  }}
                  onPlay={() => {
                    console.log('Radio: Playing');
                    setIsPlaying(true);
                  }}
                  onPause={() => setIsPlaying(false)}
                  onBuffer={() => console.log('Radio: Buffering...')}
                  onBufferEnd={() => console.log('Radio: Buffering Ended')}
                  onEnded={handleNext}
                  onProgress={(p: any) => setProgress(p.played * 100)}
                  onError={(e: any) => {
                    console.error("Radio: Player Error:", e);
                    handleNext();
                  }}
                  config={{
                    youtube: {
                      playerVars: { 
                        autoplay: 0,
                        controls: 0,
                        showinfo: 0,
                        rel: 0,
                        modestbranding: 1,
                        origin: window.location.origin
                      }
                    }
                  } as any}
                />
              )}
            </div>

            {/* Album/Track Visualizer */}
            <div className="flex flex-col items-center text-center mb-10">
              <motion.div 
                animate={{ 
                  rotate: isPlaying ? [0, 360] : 0,
                  scale: isPlaying ? [1, 1.02, 1] : 1
                }}
                transition={{ 
                  rotate: { repeat: Infinity, duration: 20, ease: "linear" },
                  scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                }}
                className="relative mb-8"
              >
                <div className="absolute inset-0 bg-[#BF76FF]/40 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
                <div className={cn(
                  "relative w-48 h-48 md:w-64 md:h-64 rounded-full border-8 transition-all duration-1000",
                  isDarkMode ? "border-white/10" : "border-white/20",
                  isPlaying ? "shadow-[0_0_80px_rgba(191,118,255,0.4)]" : "shadow-none"
                )}>
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    {currentTrack?.youtubeId ? (
                      <img 
                        src={`https://img.youtube.com/vi/${currentTrack.youtubeId}/maxresdefault.jpg`} 
                        className="w-full h-full object-cover scale-110 hover:scale-125 transition-transform duration-700" 
                        alt="Track Cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-black flex items-center justify-center">
                        <RadioIcon className="w-20 h-20 text-white/10" />
                      </div>
                    )}
                  </div>
                  {/* Center Hole */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-black rounded-full border-4 border-white/20 shadow-inner z-20" />
                </div>
              </motion.div>

              <div className="flex flex-col items-center gap-3">
                 <div className="flex items-center gap-2 bg-red-600/20 px-3 py-1 rounded-full border border-red-600/30 mb-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">No Ar</span>
                 </div>
                 
                 <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-1 line-clamp-2 px-4 leading-tight">
                   {currentTrack?.title || config?.radioTitle || "Rádio Indisponível"}
                 </h1>
                 <p className="text-white/40 text-xs md:text-sm font-bold uppercase tracking-[0.3em]">
                   {currentTrack ? "Tocando agora • YouTube" : "Adicione músicas no painel administrativo"}
                 </p>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
              {/* Progress Slider (Visual Only for YouTube) */}
              <div className="w-full space-y-2">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                   <motion.div 
                     className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#BF76FF] to-[#CC7EFF] shadow-[0_0_10px_rgba(191,118,255,0.6)]"
                     style={{ width: `${progress}%` }}
                   />
                </div>
                <div className="flex justify-between text-[10px] items-center text-white/30 font-bold uppercase tracking-widest">
                   <span>Acompanhando</span>
                   <Youtube className="w-3 h-3 text-red-500" />
                </div>
              </div>

              <div className="flex items-center justify-between w-full">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handlePrevious}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <SkipBack className="w-6 h-6 md:w-8 md:h-8" />
                </Button>

                <Button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={cn(
                    "w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl hover:scale-105 active:scale-95",
                    isPlaying 
                      ? "bg-white text-black hover:bg-white/90" 
                      : "bg-[#BF76FF] text-white hover:bg-[#BF76FF]/90 shadow-[0_0_50px_rgba(191,118,255,0.4)]"
                  )}
                >
                   {isPlaying ? (
                     <Pause className="w-10 h-10 md:w-14 md:h-14 fill-current" />
                   ) : (
                     <Play className="w-10 h-10 md:w-14 md:h-14 fill-current translate-x-1" />
                   )}
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleNext}
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <SkipForward className="w-6 h-6 md:w-8 md:h-8" />
                </Button>
              </div>

              {/* Volume & Extras */}
              <div className="flex items-center justify-between w-full pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 flex-1 max-w-[140px] md:max-w-xs group">
                  <button onClick={() => setIsMuted(!isMuted)}>
                     {isMuted || volume === 0 ? <Pause className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-[#BF76FF]" />}
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#BF76FF] transition-all group-hover:h-2"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className={cn("transition-colors", showPlaylist ? "text-[#BF76FF]" : "text-white/40 hover:text-white")}
                  >
                    <ListMusic className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Sidebar: Schedule or Playlist */}
          <aside className="lg:col-span-4 h-full flex flex-col gap-6">
             <div className={cn(
               "bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 flex-1 transition-all overflow-hidden relative",
               showPlaylist && "ring-2 ring-[#BF76FF]/30"
             )}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                    {showPlaylist ? "Minha Playlist" : "Programação TV"}
                  </h3>
                  <button 
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className="text-[10px] font-bold text-[#BF76FF] hover:underline"
                  >
                    {showPlaylist ? "Ver Grade" : "Ver Playlist"}
                  </button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide pr-2">
                   {showPlaylist ? (
                     playlist.map((track, i) => (
                       <button 
                         key={track.id}
                         onClick={() => {
                           setCurrentTrackIndex(i);
                           setIsPlaying(true);
                         }}
                         className={cn(
                           "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border group",
                           i === currentTrackIndex 
                            ? "bg-[#BF76FF] border-[#BF76FF] shadow-lg shadow-[#BF76FF]/20" 
                            : "bg-white/5 border-transparent hover:bg-white/10"
                         )}
                       >
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                             <img src={`https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg`} className="w-full h-full object-cover" alt="" />
                             {i === currentTrackIndex && isPlaying && (
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                 <motion.div
                                   animate={{ scale: [1, 1.2, 1] }}
                                   transition={{ repeat: Infinity, duration: 1 }}
                                   className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"
                                 />
                               </div>
                             )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                             <p className={cn("text-xs font-bold truncate transition-colors", i === currentTrackIndex ? "text-white" : "text-white")}>{track.title}</p>
                             <p className={cn("text-[10px] uppercase font-bold tracking-widest mt-1", i === currentTrackIndex ? "text-white/60" : "text-white/30")}>YouTube ⚡</p>
                          </div>
                          {i === currentTrackIndex ? <Pause className="w-4 h-4 text-white opacity-40" /> : <Play className="w-4 h-4 text-[#BF76FF] opacity-0 group-hover:opacity-100 transition-opacity" />}
                       </button>
                     ))
                   ) : (
                     [
                       { time: "05:00", title: "Oração da Manhã" },
                       { time: "09:00", title: "Palavra de Vida" },
                       { time: "12:00", title: "Meio-Dia Profético" },
                       { time: "15:00", title: "Tarde com Deus" },
                       { time: "18:00", title: "Oração da Noite" },
                       { time: "21:00", title: "Reprise do Culto" }
                     ].map((item, i) => (
                       <div key={i} className="flex items-center gap-4 group cursor-help">
                          <div className="w-10 text-[10px] font-bold text-white/20 group-hover:text-[#BF76FF] transition-colors">{item.time}</div>
                          <div className="h-px flex-1 bg-white/5 group-hover:bg-[#BF76FF]/20 transition-all" />
                          <div className="text-xs font-bold text-white/60 group-hover:text-white transition-colors capitalize">{item.title}</div>
                       </div>
                     ))
                   )}
                   {playlist.length === 0 && showPlaylist && (
                     <div className="text-center py-20 opacity-20">
                       <Music className="w-12 h-12 mx-auto mb-4" />
                       <p className="text-xs font-bold uppercase tracking-widest">Vazio</p>
                     </div>
                   )}
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <Button className="w-full bg-[#BF76FF]/10 text-[#BF76FF] border border-[#BF76FF]/20 rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#BF76FF] hover:text-white transition-all shadow-xl shadow-[#BF76FF]/10">
                    <Share2 className="w-4 h-4 mr-2" /> Compartilhar Rádio
                  </Button>
                </div>
             </div>

             <div className="bg-[#BF76FF] rounded-[2rem] p-8 flex flex-col gap-4 text-white relative overflow-hidden group">
               <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700" />
               <div className="relative z-10">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Pedidos de Música</h4>
                  <p className="text-lg font-black leading-tight mb-4">Mande seu louvor e peça sua oração pelo WhatsApp!</p>
                  <Button className="bg-white text-[#BF76FF] rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-6 hover:scale-105 transition-all">
                    Pedir agora
                  </Button>
               </div>
             </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
