import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import ReactPlayer from 'react-player';

interface RadioContextProps {
  tracks: any[];
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
  handleTimeUpdate: (e: any) => void;
  handleDurationChange: (e: any) => void;
  getUrlToPlay: () => string;
}

export const RadioContext = createContext<RadioContextProps | null>(null);

export function useRadio() {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
}

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<any[]>([]);
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

  const playerRef = useRef<any>(null);

  useEffect(() => {
    const unsubTracks = onSnapshot(query(collection(db, "radio-playlist"), orderBy("order", "asc")), (snap) => {
      setTracks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "radio-playlist"));

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
      unsubPlaylists();
      unsubVignettes();
    };
  }, []);

  const playTrack = (track: any, sourceQueue: any[]) => {
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
    setIsLiveMode(true);
    setCurrentTrack(null);
    setQueue([]);
    setIsPlaying(true);
    setIsPlayerOpen(true);
    setIsPlayerMinimized(false);
  };

  const togglePlay = () => {
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

  const handleTimeUpdate = (e: any) => {
    if (!isPlaying) return;
    setProgress(e.target.currentTime);
  };

  const handleDurationChange = (e: any) => {
    setDuration(e.target.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    if (playerRef.current) {
      playerRef.current.currentTime = val;
    }
  };

  const getUrlToPlay = () => {
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
      tracks, playlists, vignettes, settings,
      isLiveMode, queue, currentIndex, currentTrack, isPlaying,
      volume, progress, duration, isMuted, isPlayerOpen, isPlayerMinimized,
      setIsPlayerMinimized, playTrack, playLive, togglePlay, playNext, playPrev,
      handleSeek, setVolume, setIsMuted, playerRef, handleTimeUpdate, handleDurationChange, getUrlToPlay
    }}>
      {children}
      {/* Hidden Global Player */}
      <div className="hidden">
        {getUrlToPlay() && (!isLiveMode || !settings?.radioYoutubeLiveUrl) && (
          // @ts-ignore
          <ReactPlayer 
            ref={playerRef}
            src={getUrlToPlay()} 
            playing={isPlaying} 
            volume={volume}
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onEnded={playNext}
          />
        )}
      </div>
    </RadioContext.Provider>
  );
}
