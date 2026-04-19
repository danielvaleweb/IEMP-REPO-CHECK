import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Play, Pause, Volume2, VolumeX, Music, SkipForward, SkipBack, X, ChevronDown, Clock, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BackgroundPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check YouTube Live Status
  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        const response = await fetch("/api/live-status");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setIsLive(data.isLive);
      } catch (error) {
        setIsLive(false);
      }
    };

    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Real-time playlist from Firestore
  useEffect(() => {
    const q = query(collection(db, "musics"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPlaylist(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "musics"));
    return () => unsub();
  }, []);

  const currentTrack = playlist[currentTrackIndex];

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  const nextTrack = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  };

  const prevTrack = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  // YouTube Autoplay Logic via Iframe
  // Note: Autoplay might be blocked by browser until user interaction
  const youtubeUrl = currentTrack ? `https://www.youtube-nocookie.com/embed/${currentTrack.videoId}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${currentTrack.videoId}&origin=${window.location.origin}` : undefined;

  const handleLiveClick = () => {
    if (isLive) {
      setShowLiveModal(true);
    } else {
      setShowOfflineModal(true);
    }
  };

  const toggleFullScreen = () => {
    if (videoContainerRef.current) {
      if (!document.fullscreenElement) {
        videoContainerRef.current.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Live Status Button */}
      <button 
        onClick={handleLiveClick}
        className={cn(
          "h-14 px-6 rounded-full flex items-center gap-2 transition-all duration-500 shadow-2xl outline-none",
          isLive 
            ? "bg-red-600 text-white shadow-red-600/20" 
            : "bg-black border border-white/10 text-white/60 hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
        )}
      >
        <div className={cn(
          "w-2 h-2 rounded-full",
          isLive ? "bg-white animate-ping" : "bg-white/20"
        )} />
        <span className="text-xs font-bold tracking-widest uppercase">
          {isLive ? "AO VIVO" : "OFFLINE"}
        </span>
      </button>

      <div className={cn(
        "transition-all duration-500 ease-in-out",
        isExpanded ? "w-72" : "w-14"
      )}>
        <div className={cn(
          "transition-all duration-500 ease-in-out rounded-full overflow-hidden flex items-center p-1 shadow-2xl",
          isExpanded 
            ? "bg-[#10001D] border border-white/10 shadow-[0_0_30px_rgba(191,118,255,0.1)]" 
            : "bg-gradient-to-r from-[#2C0037] to-[#10001D] border-none shadow-none"
        )}>
          {/* Hidden YouTube Iframe for Audio */}
          {youtubeUrl && (
            <iframe
              ref={iframeRef}
              className="hidden"
              src={youtubeUrl}
              allow="autoplay"
            />
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full w-12 h-12 transition-all duration-300 shrink-0 overflow-hidden p-0",
              isExpanded
                ? "text-primary hover:bg-white/10 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                : "text-primary hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {currentTrack?.thumbnail ? (
              <img 
                src={currentTrack.thumbnail} 
                alt="" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Music className={cn("w-6 h-6", isPlaying && "animate-pulse")} />
            )}
          </Button>

          {isExpanded && (
            <div className="flex items-center gap-3 px-3 w-full animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold truncate">
                  {isPlaying ? "Tocando agora" : "Pausado"}
                </span>
                <span className="text-xs font-medium truncate text-white">
                  {currentTrack?.title || "Nenhuma música"}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 rounded-full text-primary hover:bg-transparent hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all" 
                  onClick={() => setIsExpanded(false)}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 rounded-full text-primary hover:bg-transparent hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all" 
                  onClick={toggleMute}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-2 bg-gradient-to-r from-[#2C0037] to-[#10001D] border border-white/10 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300 shadow-[0_0_30px_rgba(191,118,255,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-primary hover:bg-transparent hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all" 
                onClick={prevTrack}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="w-12 h-12 rounded-full border-primary/50 text-primary bg-[#1c002d] hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all" 
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-primary hover:bg-transparent hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all" 
                onClick={nextTrack}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                <span>Volume</span>
                <span>{isMuted ? 0 : volume}%</span>
              </div>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={(val) => {
                  setVolume(val[0]);
                  setIsMuted(false);
                }}
                className="cursor-pointer"
              />
            </div>
            <p className="text-[9px] text-muted-foreground mt-4 text-center italic">
              Sincronizado com YouTube Music
            </p>
          </div>
        )}
      </div>
    </div>

      {/* Live Video Modal */}
      <Dialog open={showLiveModal} onOpenChange={setShowLiveModal}>
        <DialogContent className="max-w-[95vw] md:max-w-7xl p-0 overflow-hidden border-none rounded-[32px] transition-all bg-white dark:bg-[#0a0a0a]">
          <div ref={videoContainerRef} className="relative aspect-video w-full bg-black group">
            <iframe 
              ref={iframeRef}
              src="https://www.youtube.com/embed/live_stream?channel=UCILgaItnqDH3plhRXD54QUg&autoplay=1"
              title="Ministério Profecia Ao Vivo"
              className="absolute inset-0 w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-tr from-[#BF76FF]/10 to-transparent">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center animate-pulse shrink-0">
                 <Play className="w-6 h-6 text-white fill-current" />
               </div>
               <div>
                 <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
                   Transmissão Ao Vivo
                 </h2>
                 <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Igreja Ministério Profecia</p>
               </div>
             </div>
             <div className="flex items-center gap-3 w-full md:w-auto">
               <Button 
                 onClick={toggleFullScreen}
                 className="flex-1 md:flex-none rounded-full h-12 px-6 bg-[#BF76FF] text-white hover:bg-[#8E44AD] font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-[#BF76FF]/20 transition-all"
               >
                 Assistir em Tela Cheia <Maximize className="w-4 h-4" />
               </Button>
               <Button 
                 variant="ghost" 
                 className="flex-1 md:flex-none rounded-full h-12 px-6 border border-black/10 dark:border-white/10 hover:bg-white hover:text-black transition-all font-bold uppercase tracking-widest text-[10px]"
                 onClick={() => setShowLiveModal(false)}
               >
                 Fechar
               </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Offline Info Modal */}
      <Dialog open={showOfflineModal} onOpenChange={setShowOfflineModal}>
        <DialogContent className="max-w-md p-8 md:p-10 rounded-[40px] border-none shadow-2xl transition-all text-center bg-white dark:bg-[#0a0a0a] text-black dark:text-white">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-6 transform -rotate-12">
            <Clock className="w-10 h-10 text-gray-400" />
          </div>
          
          <h3 className="text-2xl md:text-3xl font-black mb-3 leading-tight tracking-tighter">Estamos Offline no momento</h3>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest font-bold">
            Venha nos visitar em nossos próximos cultos presenciais:
          </p>

          <div className="space-y-3 mb-8">
            <div className="p-4 rounded-2xl flex items-center justify-between bg-gray-50 dark:bg-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Terça-feira</span>
              <span className="text-sm font-bold text-[#BF76FF]">19:30h</span>
            </div>
            <div className="p-4 rounded-2xl flex items-center justify-between bg-gray-50 dark:bg-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Sexta-feira</span>
              <span className="text-sm font-bold text-[#BF76FF]">19:30h</span>
            </div>
            <div className="p-4 rounded-2xl flex items-center justify-between bg-gray-50 dark:bg-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Domingo</span>
              <span className="text-sm font-bold text-[#BF76FF]">19:00h</span>
            </div>
          </div>

          <Button 
            className="w-full h-14 rounded-full bg-gradient-to-r from-[#BF76FF] to-[#8E44AD] text-white font-black uppercase tracking-[0.2em] text-[10px] hover:opacity-90 shadow-xl shadow-[#BF76FF]/20"
            onClick={() => setShowOfflineModal(false)}
          >
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
