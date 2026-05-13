import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import ReactPlayer from 'react-player';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService } from '@/services/firestoreService';

interface RadioContextProps {
  tracks: any[];
  radioArtists: any[];
  playlists: any[];
  vignettes: any[];
  settings: any;
  isLiveMode: boolean;
  queue: any[];
  currentIndex: number;
  currentTrack: any;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  isMuted: boolean;
  isPlayerOpen: boolean;
  isPlayerMinimized: boolean;
  setIsPlaying: (v: boolean) => void;
  setIsPlayerMinimized: (v: boolean) => void;
  playTrack: (track: any, sourceQueue: any[]) => void;
  playLive: () => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  handleSeek: (e: any) => void;
  setVolume: (v: number) => void;
  setIsMuted: (v: boolean) => void;
  playerRef: any;
  hasAccess: boolean;
  initRadio: (force?: boolean) => Promise<void>;
  isInitializing: boolean;
  isInitialized: boolean;
}

// ... unchanged interface the rest of the way up to RadioProvider ...

export const RadioContext = createContext<RadioContextProps | null>(null);

export function useRadio() {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
}

const Player = ReactPlayer as any;

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isGuest } = useAuth();
  const hasAccess = !!(user && !isGuest && profile?.role && profile.role !== "Visitante");

  const [tracks, setTracks] = useState<any[]>([]);
  const [radioArtists, setRadioArtists] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [vignettes, setVignettes] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);

  const [tracksSinceLastVignette, setTracksSinceLastVignette] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const playerRef = useRef<any>(null);

  const initRadio = async (force = false) => {
    if (isInitialized && !force) return;
    if (isInitializing) return;
    
    setIsInitializing(true);
    try {
      console.log("[RadioContext] Initializing radio data...");
      const [tracksData, artistsData, playlistsData, vignettesData, systemSettings] = await Promise.all([
        firestoreService.getCollection<any>("radio-playlist", [orderBy("order", "asc")], 1000 * 60 * 30),
        firestoreService.getCollection<any>("radio-artists", [orderBy("name", "asc")], 1000 * 60 * 60),
        firestoreService.getCollection<any>("playlists", [orderBy("createdAt", "desc")], 1000 * 60 * 30),
        firestoreService.getCollection<any>("vignettes", [orderBy("createdAt", "desc")], 1000 * 60 * 60),
        firestoreService.getDoc<any>("settings", "system", 1000 * 60 * 60)
      ]);

      setTracks(tracksData);
      setRadioArtists(artistsData);
      setPlaylists(playlistsData);
      setVignettes(vignettesData);
      if (systemSettings) setSettings(systemSettings);
      setIsInitialized(true);
    } catch (err) {
      console.error("[RadioContext] Error initializing radio data:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!hasAccess && isPlaying) {
      setIsPlaying(false);
      setIsPlayerOpen(false);
      setIsPlayerMinimized(false);
    }
  }, [hasAccess, isPlaying]);

  const playTrack = (track: any, sourceQueue: any[]) => {
    if (!hasAccess) return;
    setIsLiveMode(false);
    setQueue(sourceQueue);
    const idx = sourceQueue.findIndex(t => t.id === track.id);
    setCurrentIndex(idx >= 0 ? idx : 0);
    setCurrentTrack(track);
    setIsPlaying(true);
    setIsPlayerOpen(true);
    setIsPlayerMinimized(false);
  };

  const playLive = () => {
    if (!hasAccess) return;
    setIsLiveMode(true);
    setCurrentTrack(null);
    setQueue([]);
    setIsPlaying(true);
    setIsPlayerOpen(true);
    setIsPlayerMinimized(false);
  };

  const togglePlay = () => {
    if (!hasAccess) return;
    if (!currentTrack && !isLiveMode && tracks.length > 0) {
      playTrack(tracks[0], tracks);
      return;
    }
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    if (!newIsPlaying) {
      setIsPlayerMinimized(true);
    } else {
      setIsPlayerMinimized(false);
    }
  };

  const playNext = () => {
    if (isLiveMode || queue.length === 0) return;

    // Se temos vinhetas e já tocaram 3 músicas, tocar uma vinheta
    if (!currentTrack?.isVignette && vignettes.length > 0 && tracksSinceLastVignette >= 3) {
       const randomVignette = vignettes[Math.floor(Math.random() * vignettes.length)];
       setCurrentTrack({ ...randomVignette, isVignette: true });
       setTracksSinceLastVignette(0);
       setIsPlaying(true);
       setIsPlayerMinimized(false);
       return;
    }

    const nextIdx = (currentIndex + 1) % queue.length;
    setCurrentIndex(nextIdx);
    setCurrentTrack(queue[nextIdx]);
    if (!currentTrack?.isVignette) {
      setTracksSinceLastVignette(prev => prev + 1);
    }
    setIsPlaying(true);
    setIsPlayerMinimized(false);
  };

  const playPrev = () => {
    if (isLiveMode || queue.length === 0) return;
    const prevIdx = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIdx);
    setCurrentTrack(queue[prevIdx]);
    setIsPlaying(true);
    setIsPlayerMinimized(false);
  };

  const handleProgress = (e: any) => {
    if (!isPlaying) return;
    if (e?.target?.currentTime !== undefined) {
      setProgress(e.target.currentTime);
    }
  };

  const handleDurationChange = (e: any) => {
    if (e?.target?.duration !== undefined) {
      setDuration(e.target.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    if (playerRef.current) {
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(val, 'seconds');
      } else if (playerRef.current.currentTime !== undefined) {
        playerRef.current.currentTime = val;
      }
    }
  };

  const handlersRef = useRef({ playNext, playPrev });
  useEffect(() => {
    handlersRef.current = { playNext, playPrev };
  });

  useEffect(() => {
    if ('mediaSession' in navigator) {
      if (isPlaying) {
        const title = isLiveMode ? (settings?.radioTitle || "Rádio Ao Vivo") : currentTrack?.title || "Sintonizado";
        const artist = isLiveMode ? "Rádio" : currentTrack?.artist || "Ministério Profecia";
        const artwork = [];
        
        let imageUrl = "/placeholder.jpg";
        if (currentTrack?.youtubeId) {
          imageUrl = `https://img.youtube.com/vi/${currentTrack.youtubeId}/mqdefault.jpg`;
        } else if (currentTrack?.thumbnail) {
          imageUrl = currentTrack.thumbnail;
        }
        artwork.push({ src: imageUrl, sizes: '512x512', type: 'image/jpeg' });

        navigator.mediaSession.metadata = new MediaMetadata({ title, artist, artwork });

        navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
        navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
        navigator.mediaSession.setActionHandler('previoustrack', () => handlersRef.current.playPrev());
        navigator.mediaSession.setActionHandler('nexttrack', () => handlersRef.current.playNext());
        
        // This attempts to prevent stopping by marking the session active
        navigator.mediaSession.playbackState = "playing";
      } else {
        navigator.mediaSession.playbackState = "paused";
      }
    }
  }, [isPlaying, currentTrack, isLiveMode, settings]);

  const getUrlToPlay = () => {
    if (!hasAccess) return "";
    if (isLiveMode) {
      return settings?.radioYoutubeLiveUrl || settings?.radioStreamUrl || "";
    }
    if (currentTrack) {
      return currentTrack.youtubeId ? `https://youtube.com/watch?v=${currentTrack.youtubeId}` : currentTrack.rawUrl || currentTrack.youtubeUrl;
    }
    return "";
  };

  const silentAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (silentAudioRef.current) {
      if (isPlaying) {
        const playPromise = silentAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } else {
        silentAudioRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <RadioContext.Provider value={{
      tracks, radioArtists, playlists, vignettes, settings,
      isLiveMode, queue, currentIndex, currentTrack, isPlaying, setIsPlaying,
      volume, progress, duration, isMuted, isPlayerOpen, isPlayerMinimized,
      setIsPlayerMinimized, playTrack, playLive, togglePlay, playNext, playPrev,
      handleSeek, setVolume, setIsMuted, playerRef, handleProgress, handleDurationChange, getUrlToPlay, hasAccess,
      initRadio, isInitializing, isInitialized
    } as any}>
      {children}
      {/* Hidden Global Player */}
      <div className="hidden">
        {getUrlToPlay() && (!isLiveMode || !settings?.radioYoutubeLiveUrl) && (
          <Player 
            key={getUrlToPlay()}
            ref={playerRef}
            url={getUrlToPlay()} 
            playing={isPlaying} 
            volume={volume}
            muted={isMuted}
            onProgress={(state: any) => setProgress(state.playedSeconds)}
            onDuration={setDuration}
            onEnded={playNext}
            playsinline={true}
            config={{
              youtube: {
                playerVars: {
                  playsinline: 1
                }
              },
              file: {
                forceAudio: true,
                attributes: {
                  playsInline: true,
                  controlsList: 'nodownload'
                }
              }
            } as any}
          />
        )}
        
        {/* Silent audio to keep the browser instance alive in the background on mobile devices */}
        <audio 
          src="data:audio/mp3;base64,//OlkAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAFAAAHOwADBQgLDhATFhkcHSAjJigrLjEzNjk8P0JDREVHSlBTVFhZXV9iZWdqbXF0d3p+gYOGiYyPkZWWmJydoKSnqqyvsbS3ubvAwcLEx8rMz9PU1tna3eDi5ebp7O/x9Pf5/P8AAAA8TEFNRTMuMTAwA8EAAAAALisAABRAJAwCAgAEAAcBzgAAO6mO/QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//Olk0A8AAMwBAADQgDZwAAAAADwAA//Olk0A8AAMwBAADQgDZwAAAAADwAA//Olk0A8AAMwBAADQgDZwAAAAADwAA//Olk0A8AAMwBAADQgDZwAAAAADwAA//Olk0A8AAMwBAADQgDZwAAAAADwAA"
          loop
          autoPlay={isPlaying}
          muted={false}
          playsInline
          style={{ display: 'none' }}
          ref={silentAudioRef}
        />
      </div>
    </RadioContext.Provider>
  );
}
