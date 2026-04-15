import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Play, Pause, Volume2, VolumeX, Music, SkipForward, SkipBack, X, ChevronDown } from "lucide-react";
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
  const youtubeUrl = currentTrack ? `https://www.youtube-nocookie.com/embed/${currentTrack.videoId}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${currentTrack.videoId}&origin=${window.location.origin}` : "";

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
  );
}
