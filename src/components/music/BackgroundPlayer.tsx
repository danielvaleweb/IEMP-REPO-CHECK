import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Music, SkipForward, SkipBack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function BackgroundPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
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
  const youtubeUrl = currentTrack ? `https://www.youtube.com/embed/${currentTrack.videoId}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${currentTrack.videoId}` : "";

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-500 ease-in-out",
      isExpanded ? "w-72" : "w-14"
    )}>
      <div className="glass-panel rounded-full overflow-hidden flex items-center p-1 shadow-2xl shadow-primary/20">
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
          className="rounded-full w-12 h-12 hover:bg-primary/20 text-primary shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Music className={cn("w-6 h-6", isPlaying && "animate-pulse")} />
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
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-white/10" onClick={togglePlay}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-white/10" onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {isExpanded && (
        <div className="mt-2 glass-panel rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" onClick={prevTrack}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="w-12 h-12 rounded-full border-primary/50 hover:bg-primary/20" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" onClick={nextTrack}>
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
  );
}
