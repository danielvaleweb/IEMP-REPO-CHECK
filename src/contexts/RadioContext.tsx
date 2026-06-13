import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import ReactPlayer from 'react-player';
import { useAuth } from '@/contexts/AuthContext';

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
  isShuffle: boolean;
  isRepeat: boolean;
  setIsPlaying: (v: boolean) => void;
  setIsPlayerMinimized: (v: boolean) => void;
  setIsShuffle: (v: boolean) => void;
  setIsRepeat: (v: boolean) => void;
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
  initializeRadio: () => void;
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
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const isSkippingRef = useRef(false);

  const [tracksSinceLastVignette, setTracksSinceLastVignette] = useState(0);

  const playerRef = useRef<any>(null);

  const [isInitialized, setIsInitialized] = useState(false);

  const initializeRadio = () => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;

    const unsubTracks = onSnapshot(query(collection(db, "radio-playlist"), orderBy("order", "asc")), (snap) => {
      setTracks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "radio-playlist"));

    const unsubArtists = onSnapshot(query(collection(db, "radio-artists"), orderBy("name", "asc")), (snap) => {
      setRadioArtists(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "radio-artists"));

    const unsubPlaylists = onSnapshot(query(collection(db, "playlists"), orderBy("createdAt", "desc")), (snap) => {
      setPlaylists(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "playlists"));

    const unsubVignettes = onSnapshot(query(collection(db, "vignettes"), orderBy("createdAt", "desc")), (snap) => {
      setVignettes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "vignettes"));

    const getSystemSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "system"));
        if (snap.exists()) {
          setSettings(snap.data());
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, "settings/system");
      }
    };
    getSystemSettings();

    return () => {
      unsubTracks();
      unsubArtists();
      unsubPlaylists();
      unsubVignettes();
    };
  }, [isInitialized]);

  useEffect(() => {
    if (!hasAccess && isPlaying) {
      setIsPlaying(false);
      setIsPlayerOpen(false);
      setIsPlayerMinimized(false);
    }
  }, [hasAccess, isPlaying]);

  const playTrack = (track: any, sourceQueue: any[]) => {
    if (!hasAccess) return;
    initializeRadio();
    setIsLiveMode(false);
    setQueue(sourceQueue);
    const idx = sourceQueue.findIndex(t => t.id === track.id);
    setCurrentIndex(idx >= 0 ? idx : 0);
    setCurrentTrack(track);
    setProgress(0);
    setDuration(0);
    setIsPlaying(true);
    setIsPlayerOpen(true);
    setIsPlayerMinimized(false);
  };

  const playLive = () => {
    if (!hasAccess) return;
    initializeRadio();
    setIsLiveMode(true);
    setCurrentTrack(null);
    setQueue([]);
    setProgress(0);
    setDuration(0);
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
    if (isSkippingRef.current) return;

    isSkippingRef.current = true;
    setTimeout(() => { isSkippingRef.current = false; }, 2000);

    // Se temos vinhetas e já tocaram 3 músicas, tocar uma vinheta
    if (!currentTrack?.isVignette && vignettes.length > 0 && tracksSinceLastVignette >= 3) {
      const randomVignette = vignettes[Math.floor(Math.random() * vignettes.length)];
      setCurrentTrack({ ...randomVignette, isVignette: true });
      setTracksSinceLastVignette(0);
      setIsPlaying(true);
      setIsPlayerMinimized(false);
      return;
    }

    let nextIdx;
    if (isRepeat && currentTrack && !currentTrack.isVignette) {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(0, 'seconds');
        setIsPlaying(true);
        return;
      }
      nextIdx = currentIndex;
    } else if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = (currentIndex + 1) % queue.length;
    }

    setCurrentIndex(nextIdx);
    setCurrentTrack(queue[nextIdx]);
    setProgress(0);
    setDuration(0);
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
    setProgress(0);
    setDuration(0);
    setIsPlaying(true);
    setIsPlayerMinimized(false);
  };

  const handleProgress = (e: any) => {
    if (!isPlaying) return;
    
    let currentPos = -1;
    let currentDur = -1;

    if (e?.playedSeconds !== undefined) {
      currentPos = e.playedSeconds;
      if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
        currentDur = playerRef.current.getDuration();
      }
    } else if (e?.target?.currentTime !== undefined) {
      currentPos = e.target.currentTime;
      currentDur = e.target.duration;
    }

    if (currentPos !== -1 && !isNaN(currentPos)) {
      setProgress(currentPos);
    }

    if (currentDur !== -1 && currentDur !== undefined && !isNaN(currentDur) && currentDur > 0) {
      setDuration((prev: number) => (prev === 0 || isNaN(prev)) ? currentDur : prev);
      
      // Fallback for background throttling: if we are within 1 second of the end, force next track
      if (currentPos >= currentDur - 1 && !isSkippingRef.current) {
        playNext();
      }
    }
  };

  const handleDurationChange = (e: any) => {
    if (typeof e === 'number' && e > 0 && !isNaN(e)) {
      setDuration(e);
    } else if (e?.target?.duration !== undefined && !isNaN(e.target.duration) && e.target.duration > 0) {
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

  return (
    <RadioContext.Provider value={{
      tracks, radioArtists, playlists, vignettes, settings,
      isLiveMode, queue, currentIndex, currentTrack, isPlaying, setIsPlaying,
      volume, progress, duration, isMuted, isPlayerOpen, isPlayerMinimized,
      isShuffle, isRepeat, setIsShuffle, setIsRepeat,
      setIsPlayerMinimized, playTrack, playLive, togglePlay, playNext, playPrev,
      handleSeek, setVolume, setIsMuted, playerRef, handleProgress, handleDurationChange, getUrlToPlay, hasAccess, initializeRadio
    } as any}>
      {children}
      {/* Hidden Global Player - using fixed on-screen foreground to prevent aggressive background/minimize throttling by Chromium's occlusion tracker */}
      <div className="fixed top-0 left-0 w-[10px] h-[10px] opacity-[0.01] pointer-events-none z-[9999]">
        {getUrlToPlay() && (!isLiveMode || !settings?.radioYoutubeLiveUrl) && (
          <ReactPlayer
            ref={playerRef}
            src={getUrlToPlay()}
            playing={isPlaying}
            volume={volume}
            muted={isMuted}
            {...({
              onTimeUpdate: handleProgress,
              onDurationChange: handleDurationChange,
              onProgress: handleProgress,
              onDuration: handleDurationChange
            } as any)}
            onEnded={playNext}
            playsInline={true}
            config={{
              youtube: {
                playsInline: true,
                params: {
                  playsinline: 1
                }
              } as any,
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
          ref={(audio) => {
            if (audio) {
              if (isPlaying) {
                audio.play().catch(() => { });
              } else {
                audio.pause();
              }
            }
          }}
        />
      </div>
    </RadioContext.Provider>
  );
}
