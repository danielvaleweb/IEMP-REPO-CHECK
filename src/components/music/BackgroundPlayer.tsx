import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Play, Pause, Volume2, VolumeX, Music, SkipForward, SkipBack, X, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useFavorites } from "@/contexts/FavoritesContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
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
  const { toggleFavorite, isFavorite } = useFavorites();

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

  const handleShare = () => {
    if (currentTrack) {
      const url = `https://www.youtube.com/watch?v=${currentTrack.videoId}`;
      navigator.clipboard.writeText(url);
      alert("Link da música copiado!");
    }
  };

  // YouTube Autoplay Logic via Iframe
  // Note: Autoplay might be blocked by browser until user interaction
  const youtubeUrl = currentTrack ? `https://www.youtube.com/embed/${currentTrack.videoId}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${currentTrack.videoId}` : "";

  const handleLiveClick = () => {
    if (location.pathname === "/") {
      window.dispatchEvent(new CustomEvent('open-live-video'));
    } else {
      navigate("/#hero");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Live Status Button */}
      <button 
        onClick={handleLiveClick}
        className={cn(
          "h-14 px-6 rounded-full flex items-center gap-2 transition-all duration-500 shadow-2xl outline-none",
          isLive 
            ? "bg-red-600 text-white shadow-red-600/20" 
            : "bg-[#0f0d11] border border-white/10 text-white/60 hover:text-white"
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

      {/* Music Player */}
      <div className={cn(
        "transition-all duration-500 ease-in-out flex items-center relative",
        isExpanded ? "w-auto" : "w-14"
      )}>
        {!isExpanded && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 bottom-full mb-2 animate-float-up",
                  i % 2 === 0 ? "text-white/60" : "text-primary/60"
                )}
                style={{
                  animationDelay: `${i * 1}s`,
                  fontSize: `${12 + i * 4}px`
                }}
              >
                <Music className="w-full h-full" />
              </div>
            ))}
          </div>
        )}
        
        {!isExpanded ? (
          <div className="relative group">
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 bg-primary/50 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Rádio IEMPTV
              {/* Tooltip Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-primary/50" />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-14 h-14 bg-[#0f0d11] border border-white/10 text-primary hover:bg-white hover:text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-500 shadow-2xl"
              onClick={() => setIsExpanded(true)}
            >
              <Music className={cn("w-6 h-6 transition-transform group-hover:scale-110", isPlaying && "animate-pulse")} />
            </Button>
          </div>
        ) : (
          <div className="h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-1.5 flex items-center gap-4 shadow-2xl animate-in fade-in slide-in-from-right-8 duration-500">
            {/* Controls */}
            <div className="flex items-center gap-1 px-2">
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/10" onClick={prevTrack}>
                <SkipBack className="w-5 h-5 fill-current" />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white hover:bg-white/10" onClick={togglePlay}>
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/10" onClick={nextTrack}>
                <SkipForward className="w-5 h-5 fill-current" />
              </Button>
            </div>

            {/* Song Info Card - Click to open playlist */}
            <Dialog>
              <DialogTrigger nativeButton={false} render={
                <div className="bg-white/10 rounded-xl p-1 flex items-center gap-2 min-w-[200px] max-w-[280px] cursor-pointer hover:bg-white/20 transition-colors group">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-black/40 relative">
                    {currentTrack?.thumbnail ? (
                      <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-5 h-5 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1 text-left">
                    <span className="text-[9px] uppercase tracking-widest text-primary font-bold text-left">
                      Tocando agora
                    </span>
                    <span className="text-xs font-bold text-white truncate text-left w-full">
                      {currentTrack?.title || "Nenhuma música"}
                    </span>
                    <span className="text-[10px] text-white/50 truncate text-left w-full">
                      {currentTrack?.artist || "Ministério Profecia"}
                    </span>
                  </div>
                </div>
              } />
              <DialogContent className="bg-[#0f0d11] border-white/10 text-white max-w-2xl p-0 overflow-hidden rounded-3xl">
                <DialogHeader className="p-6 border-b border-white/10">
                  <DialogTitle className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-primary" />
                    Playlist do Ministério
                  </DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                  <div className="grid gap-1">
                    {playlist.map((track, idx) => (
                      <button
                        key={track.id}
                        onClick={() => {
                          setCurrentTrackIndex(idx);
                          setIsPlaying(true);
                        }}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-xl transition-all text-left group",
                          currentTrackIndex === idx 
                            ? "bg-primary/20 border border-primary/20" 
                            : "hover:bg-white/5 border border-transparent"
                        )}
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-black/40 relative">
                          <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                          {currentTrackIndex === idx && isPlaying && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="flex gap-0.5 items-end h-4">
                                <div className="w-1 bg-primary animate-[music-bar_0.6s_ease-in-out_infinite]" />
                                <div className="w-1 bg-primary animate-[music-bar_0.8s_ease-in-out_infinite_0.1s]" />
                                <div className="w-1 bg-primary animate-[music-bar_0.7s_ease-in-out_infinite_0.2s]" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            "text-sm font-bold truncate",
                            currentTrackIndex === idx ? "text-primary" : "text-white"
                          )}>
                            {track.title}
                          </h4>
                          <p className="text-xs text-white/40 truncate">{track.artist || "Ministério Profecia"}</p>
                        </div>
                        {currentTrackIndex === idx ? (
                          <div className="text-primary text-[10px] font-bold uppercase tracking-widest">Tocando</div>
                        ) : (
                          <Play className="w-4 h-4 text-white/0 group-hover:text-white/40 transition-all" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8 rounded-full text-white/40 hover:text-white shrink-0 ml-[-12px] mr-2"
              onClick={() => setIsExpanded(false)}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Actions */}
            <div className="flex items-center gap-1 px-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "w-10 h-10 rounded-full transition-colors",
                  currentTrack && isFavorite(currentTrack.id) ? "text-red-500 hover:bg-red-500/10" : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                onClick={() => currentTrack && toggleFavorite(currentTrack)}
              >
                <Heart className={cn("w-5 h-5", currentTrack && isFavorite(currentTrack.id) && "fill-current")} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
              </Button>
              
              <Popover>
                <PopoverTrigger nativeButton={false} render={
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/10">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                } />
                <PopoverContent className="w-40 bg-black/80 backdrop-blur-xl border-white/10 p-4 rounded-2xl mb-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] text-white/50 uppercase tracking-widest font-bold">
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
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Hidden YouTube Iframe for Audio */}
        {youtubeUrl && (
          <iframe
            ref={iframeRef}
            className="hidden"
            src={youtubeUrl}
            allow="autoplay"
          />
        )}
      </div>
    </div>
  );
}
