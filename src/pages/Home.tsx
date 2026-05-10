import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Heart, 
  Share2, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  X,
  Tag,
  Youtube,
  Camera,
  Plus,
  Check,
  ThumbsUp,
  ChevronDown,
  Hammer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { cn, getImageUrl } from "@/lib/utils";
import { db, auth, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { MovieCard } from "@/components/movies/MovieCard";

// Reusable Netflix Style Card Component removed and extracted to its own file.

export default function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [nextService, setNextService] = useState("Domingo às 19:00");
  const [videos, setVideos] = useState<any[]>([]);
  const [myList, setMyList] = useState<string[]>([]);
  const { favorites, favoriteIds, toggleFavorite: toggleFavoriteCtx, isFavorite } = useFavorites();
  const [config, setConfig] = useState<any>({ videoCardsEnabled: true, enableHeaderVideos: true });
  const [similarVideos, setSimilarVideos] = useState<any[]>([]);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [activeSimilarVideo, setActiveSimilarVideo] = useState<any | null>(null);
  
  // Welcome & LGPD Modals
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showLgpdModal, setShowLgpdModal] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    if (user && profile && !hasShownWelcome) {
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `welcome_modal_shown_${profile.id || user.uid}`;
      const lastShown = localStorage.getItem(storageKey);

      if (lastShown !== today) {
        // Show Welcome first, then check LGPD
        setShowWelcomeModal(true);
        localStorage.setItem(storageKey, today);
      } else if (profile.role === "Visitante" && !profile.lgpdAccepted) {
        // If already seen welcome today but LGPD not accepted, show LGPD (ONLY VISITORS)
        setShowLgpdModal(true);
      }
      setHasShownWelcome(true);
    }
  }, [user, profile, hasShownWelcome]);

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false);
    if (user && profile && profile.role === "Visitante" && !profile.lgpdAccepted) {
      setShowLgpdModal(true);
    }
  };

  const handleLgpdAccept = async () => {
    if (user && profile) {
      try {
        const userRef = doc(db, "members", profile.id || user.uid);
        await setDoc(userRef, { lgpdAccepted: true }, { merge: true });
        setShowLgpdModal(false);
      } catch (err: any) {
        // Fallback or user might be stored in a different collection
        console.error("Error setting LGPD", err);
        setShowLgpdModal(false); // allow them to proceed anyway
      }
    }
  };

  useEffect(() => {
    // Load config
    const unsubscribeConfig = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig(prev => ({ ...prev, ...data }));
        if (data.nextService) {
          setNextService(data.nextService);
        }
      }
    }, (err) => console.error("Error loading settings:", err));

    return () => {
      unsubscribeConfig();
    };
  }, []);

  const handleToggleMyList = async (e: React.MouseEvent, video: any) => {
    e.stopPropagation();
    if (!user) {
      navigate('/admin?message=precisamos que você esteja logado para adicionar à sua lista');
      return;
    }

    const docRef = doc(db, "users", user.uid, "myList", video.id);
    if (myList.includes(video.id)) {
      await deleteDoc(docRef);
    } else {
      const cleanVideo = Object.fromEntries(Object.entries(video).filter(([_, v]) => v !== undefined));
      await setDoc(docRef, cleanVideo);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, video: any) => {
    e.stopPropagation();
    if (!user) {
      navigate('/admin?message=precisamos que você esteja logado para favoritar conteúdos');
      return;
    }
    await toggleFavoriteCtx({
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnail || video.image,
      published: video.published || video.date,
      link: video.link || (video.typeEvent === 'culto' ? `/galeria?album=${video.id}` : `/evento/${video.id}`),
      category: video.category === "event" ? "event" : "video"
    });
  };

  const handleShowSimilar = (video: any) => {
    setActiveSimilarVideo(video);
    
    const similar = videos.filter(v => {
      if (v.id === video.id) return false;
      
      // If the current video has tags, find videos with ANY matching tag
      if (video.tags && video.tags.length > 0) {
        return v.tags?.some((t: string) => video.tags.includes(t)) || 
               video.tags.some((t: string) => v.title?.toLowerCase().includes(t.toLowerCase()));
      }
      
      // Fallback logic for legacy/untagged videos
      const tagToMatch = video.title?.toLowerCase().includes("pregação") ? "pregação" : 
                       video.category === "event" ? "event" : "video";
                       
      return v.category === tagToMatch || 
             v.title?.toLowerCase().includes(tagToMatch.toLowerCase());
    }).slice(0, 9);
    
    setSimilarVideos(similar);
    setShowSimilarModal(true);
  };
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [infoModalVideo, setInfoModalVideo] = useState<any | null>(null);

  // Consolidated with the primary config effect above
  
  const nextVideo = useCallback(() => {
    if (videos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % Math.min(videos.length, 6));
    setShowVideo(false);
  }, [videos.length]);

  const prevVideo = useCallback(() => {
    if (videos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + Math.min(videos.length, 6)) % Math.min(videos.length, 6));
    setShowVideo(false);
  }, [videos.length]);

  const cleanTitle = (title: string) => {
    // Preserve dates and numbers for church services, just clean extra whitespace and common suffixes
    return title.replace(/\s+/g, ' ').trim();
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const cacheKey = "cachedEvents_v4";
        const cacheTimeKey = "cachedEventsTime_v4";
        const cached = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(cacheTimeKey);

        let allEvents = [];

        // 5 minutes in milliseconds = 300000
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime) < 300000)) {
          console.log("Using cached events");
          const parsed = JSON.parse(cached);
          allEvents = parsed.map((e: any) => ({
             ...e, 
             fullDate: new Date(e.fullDate)
          }));
        } else {
          console.log("Fetching all events from Firebase");
          const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          
          allEvents = snapshot.docs.map(doc => {
            const data = doc.data();
            let displayDate = data.date || "";
            let displayTime = "";
            
            // Handle the new format: DD/MM/YYYY - HH:mm - HH:mm
            if (displayDate.includes(' - ')) {
              const parts = displayDate.split(' - ');
              displayDate = parts[0];
              displayTime = parts[1]; // Start time
            }

            // Try to parse the date for sorting/filtering
            let eventDate = new Date(0); // Default for unparseable dates
            let formattedDate = displayDate;
            if (displayDate) {
              const dateString = displayDate.replace(/T.*$/, '').replace(/\s+/g, '');
              const dateParts = dateString.split(/[-/]/);
              if (dateParts.length >= 2) {
                let year, month, day;
                if (dateParts[0].length === 4) { // YYYY-MM-DD
                  year = parseInt(dateParts[0]);
                  month = parseInt(dateParts[1]) - 1;
                  day = parseInt(dateParts[2] || "1");
                } else { // DD/MM/YYYY
                  day = parseInt(dateParts[0]);
                  month = parseInt(dateParts[1]) - 1;
                  year = new Date().getFullYear();
                  if (dateParts.length >= 3) {
                    year = parseInt(dateParts[2]);
                    if (year < 100) year += 2000;
                  }
                }
                if (!isNaN(day) && !isNaN(month)) {
                   eventDate = new Date(year, month, day);
                   
                   // Try extracting time if present
                   if (data.date && data.date.includes('T')) {
                     const timeStr = data.date.split('T')[1];
                     if (timeStr) {
                       const timeParts = timeStr.split(':');
                       if (timeParts.length >= 2) {
                         eventDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
                       }
                     }
                   }

                   const yy = year.toString().slice(-2);
                   const dd = day.toString().padStart(2, '0');
                   const mm = (month + 1).toString().padStart(2, '0');
                   formattedDate = `${dd}-${mm}-${yy}`;
                }
              }
            }

            return {
              id: doc.id,
              title: data.title,
              description: data.content,
              date: formattedDate,
              time: displayTime,
              category: data.organization || "Evento",
              image: data.image || "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&q=80&w=1200",
              fullDate: eventDate,
              invitedMembers: data.invitedMembers || [],
              neighborhood: data.neighborhood || "",
              rating: "5.0", // Fixed rating instead of random to look more professional
              gallery: data.gallery || [],
              typeEvent: data.typeEvent || "evento",
              hideFromClicks: data.hideFromClicks || false,
              menuSource: data.menuSource,
              status: data.status
            };
          }).filter(e => 
            e.title && 
            e.title.trim() !== "" && 
            e.menuSource !== "agenda" && 
            e.status !== "pending"
          );

          localStorage.setItem(cacheKey, JSON.stringify(allEvents));
          localStorage.setItem(cacheTimeKey, Date.now().toString());
        }

        const now = new Date();
        const nowMidnight = new Date();
        nowMidnight.setHours(0, 0, 0, 0);

        const upcoming = allEvents
          .filter((e: any) => {
            if (e.typeEvent === 'culto') return false;
            const eDate = new Date(e.fullDate);
            eDate.setHours(0,0,0,0);
            return eDate.getTime() > nowMidnight.getTime();
          })
          .sort((a: any, b: any) => a.fullDate.getTime() - b.fullDate.getTime());
        
        const past = allEvents
          .filter((e: any) => {
            const eDate = new Date(e.fullDate);
            eDate.setHours(0,0,0,0);
            return eDate.getTime() <= nowMidnight.getTime();
          })
          .sort((a: any, b: any) => b.fullDate.getTime() - a.fullDate.getTime());

        setAllEvents(allEvents);
        setUpcomingEvents(upcoming);
        setPastEvents(past);
      } catch (err) {
        console.error("Error loading events:", err);
      }
    };

    fetchEvents();

    const unsubscribeBlog = onSnapshot(query(collection(db, "blog"), limit(6)), (snap) => {
      setBlogPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Error loading blog posts:", err));

    const unsubscribeVideos = onSnapshot(query(collection(db, "videos"), orderBy("createdAt", "desc")), (snap) => {
      setVideos(snap.docs.map(doc => {
        const data = doc.data();
        const getYoutubeId = (url: string) => {
          if (!url) return null;
          if (url.length === 11 && !url.includes('/') && !url.includes('?')) return url;
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
          const match = url.match(regExp);
          return (match && match[2].length === 11) ? match[2] : null;
        };
        const parsedId = getYoutubeId(data.url);
        const safeId = parsedId || doc.id;
        return {
          id: safeId,
          title: data.title,
          badge: data.badge,
          description: data.description || "",
          thumbnail: data.thumbnail || (parsedId ? `https://img.youtube.com/vi/${parsedId}/maxresdefault.jpg` : "/thumb-padrao.jpg"),
          published: data.published || (data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('pt-BR') : ""),
          link: parsedId ? `https://www.youtube.com/watch?v=${parsedId}` : (data.url || `https://www.youtube.com/watch?v=${safeId}`),
          tags: data.tags || (data.title?.toLowerCase().includes("pregação") ? ["pregação"] : []),
          category: data.category || (data.title?.toLowerCase().includes("pregação") ? "pregação" : "geral")
        };
      }));
    }, (err) => console.error("Error loading videos:", err));

    return () => {
      unsubscribeBlog();
      unsubscribeVideos();
    };
  }, []);

  useEffect(() => {
    let unsubscribeList = () => {};
    if (user) {
      unsubscribeList = onSnapshot(collection(db, "users", user.uid, "myList"), (snapshot) => {
        setMyList(snapshot.docs.map(d => d.id));
      }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/myList`));
    } else {
      setMyList([]);
    }
    return () => unsubscribeList();
  }, [user]);

  // Removed automated YouTube fetch logic
  useEffect(() => {
    // Only attempt to fetch when settings are available
    // const configHandle = config.youtubeHandle || "@ministerio_profecia";
  }, [config.youtubeChannelId, config.youtubeHandle]);

  // Auto-play carousel every 30 seconds for videos
  useEffect(() => {
    if (videos.length === 0) return;
    const timer = setInterval(() => {
      nextVideo();
    }, 30000);
    return () => clearInterval(timer);
  }, [nextVideo, videos.length]);

  // Auto-play event carousel every 10 seconds
  useEffect(() => {
    const totalEvents = upcomingEvents.length + pastEvents.length;
    if (totalEvents <= 1) return;
    const timer = setInterval(() => {
      setCurrentEventIndex((prev) => (prev + 1) % totalEvents);
    }, 10000);
    return () => clearInterval(timer);
  }, [upcomingEvents.length, pastEvents.length]);

  // Show video after 3 seconds of slide change
  useEffect(() => {
    setShowVideo(false);
    if (!config.enableHeaderVideos) return;
    
    const timer = setTimeout(() => {
      setShowVideo(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentIndex, config.enableHeaderVideos]);

  useEffect(() => {
    const handleOpenLive = () => {
      const heroElement = document.getElementById('hero');
      if (heroElement) {
        heroElement.scrollIntoView({ behavior: 'smooth' });
      }
      if (videos.length > 0) {
        setSelectedVideo(videos[0]);
      }
    };

    if (window.location.hash === '#hero' && videos.length > 0) {
      handleOpenLive();
    }

    window.addEventListener('open-live-video', handleOpenLive);
    return () => window.removeEventListener('open-live-video', handleOpenLive);
  }, [videos]);

  const formatVideoDate = (published: string) => {
    if (!published) return "";
    const date = new Date(published);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
    // If it's a relative string like "Há 2 dias" or "Recentemente"
    return published;
  };

  const handleWatchVideo = (video: any) => {
    if (!video) return;
    if (video.id.includes('fallback')) {
      window.open(video.link || "https://www.youtube.com/@ministerio_profecia/videos", '_blank');
      return;
    }
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    if (isMobile) {
      setInfoModalVideo(video);
    } else {
      setSelectedVideo(video);
      setIsWatching(true);
    }
  };

  return (
    <div className="flex flex-col bg-black">
      <div className={cn(
        "fixed inset-0 bg-white z-[9999] pointer-events-none transition-opacity duration-300",
        isFlashing ? "opacity-100" : "opacity-0"
      )} />
      {/* Hero Section - Netflix Style */}
      <section id="hero" className="relative min-h-[80vh] md:h-screen w-full bg-black text-white overflow-visible"> {/** Removido overflow-hidden para permitir scroll mais natural */}
        <AnimatePresence mode="wait">
          {videos[currentIndex] && (
            <motion.div
              key={`main-video-${videos[currentIndex].id}-${currentIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full"
            >
              {/* Background Video/Image */}
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                {showVideo && !isWatching ? (
                  <div className="absolute inset-0 w-full h-full pointer-events-none">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videos[currentIndex].id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videos[currentIndex].id}&start=0&modestbranding=1&rel=0&origin=${window.location.origin}`}
                      className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 border-none scale-105"
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                ) : (
                    <img
                      src={getImageUrl(videos[currentIndex].thumbnail)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const videoId = videos[currentIndex].id;
                        if (target.src.includes('maxresdefault')) {
                          target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        } else if (target.src.includes('hqdefault')) {
                          target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                        } else {
                          target.src = '/thumb-padrao.jpg';
                        }
                      }}
                    />
                )}
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
              </div>

              {/* Content Overlay */}
              <div className="relative z-10 h-full flex flex-col justify-end items-start text-left px-6 md:px-16 pb-24 md:pb-32 pointer-events-none">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="max-w-3xl pointer-events-auto"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {videos[currentIndex].tags && videos[currentIndex].tags.length > 0 ? (
                      videos[currentIndex].tags.slice(0, 2).map((tag: string, i: number) => (
                        <span key={i} className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-widest shadow-lg">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-widest shadow-lg">
                        {videos[currentIndex].badge || (isLive && currentIndex === 0 ? "Ao Vivo" : "Gravado")}
                      </span>
                    )}
                    <span className="text-white/90 text-sm font-medium drop-shadow-md">
                      {(() => {
                        const dateStr = videos[currentIndex].published;
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        }
                        return dateStr;
                      })()}
                    </span>
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tighter uppercase line-clamp-2 drop-shadow-xl">
                    {cleanTitle(videos[currentIndex].title)}
                  </h1>
                  
                  <div className="flex items-center gap-4 mt-6">
                    <Button
                      size="lg"
                      className="bg-white text-black hover:bg-white/90 hover:scale-105 transition-all duration-300 rounded-md px-8 h-12 text-lg font-bold flex items-center gap-2 group"
                      onClick={() => handleWatchVideo(videos[currentIndex])}
                    >
                      <Play className="w-6 h-6 fill-current" />
                      Assistir
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className={cn(
                        "rounded-md px-8 h-12 text-lg font-bold flex items-center gap-2 transition-all duration-300",
                        myList.includes(videos[currentIndex].id)
                          ? "bg-gradient-to-r from-[#BF76FF] to-purple-800 text-white border-none hover:opacity-90 shadow-[0_0_20px_rgba(191,118,255,0.4)]"
                          : "bg-black/40 backdrop-blur-md border-none text-white hover:bg-white/20"
                      )}
                      onClick={(e) => handleToggleMyList(e, videos[currentIndex])}
                    >
                      {myList.includes(videos[currentIndex].id) ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                      {myList.includes(videos[currentIndex].id) ? "Adicionado!" : "Assistir Depois"}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Screen Watch Mode */}
        <AnimatePresence>
          {isWatching && selectedVideo && (
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="fixed inset-0 z-[9999] bg-black"
            >
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.id}?autoplay=1&controls=1&modestbranding=1&rel=0&origin=${window.location.origin}`}
                className="w-full h-full border-none"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-[80px] right-8 text-white hover:bg-white hover:text-black rounded-full z-[10000] transition-colors"
                onClick={() => setIsWatching(false)}
              >
                <X className="w-8 h-8" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Modal for Mobile */}
        <AnimatePresence>
          {infoModalVideo && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-5xl bg-[#181818] rounded-2xl overflow-hidden shadow-2xl"
              >
                <button 
                  onClick={() => setInfoModalVideo(null)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-white hover:text-black transition-colors text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <div className="aspect-video w-full relative">
                  {infoModalVideo.id.includes('fallback') ? (
                    <img 
                      src={infoModalVideo.thumbnail} 
                      alt={infoModalVideo.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${infoModalVideo.id}?autoplay=1&controls=1&modestbranding=1&rel=0&origin=${window.location.origin}`}
                      title={infoModalVideo.title}
                      className="w-full h-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
                
                <div className="p-4 sm:p-8 space-y-4 max-h-[40vh] overflow-y-auto">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl sm:text-3xl font-bold">{infoModalVideo.title}</h2>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={(e) => handleToggleMyList(e, infoModalVideo)}
                        className={cn(
                          "flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold transition-all border text-sm sm:text-base",
                          myList.includes(infoModalVideo.id) 
                            ? "bg-gradient-to-r from-[#BF76FF] to-purple-800 text-white border-transparent hover:opacity-90 shadow-[0_0_20px_rgba(191,118,255,0.4)]" 
                            : "bg-white/10 text-white hover:bg-white/20 border-white/20"
                        )}
                      >
                        {myList.includes(infoModalVideo.id) ? <Check className="w-4 sm:w-5 h-4 sm:h-5" /> : <Plus className="w-4 sm:w-5 h-4 sm:h-5" />}
                        {myList.includes(infoModalVideo.id) ? "Adicionado!" : "Assistir Depois"}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                    <span className="text-green-500 font-bold">98% Relevante</span>
                    {infoModalVideo.tags && infoModalVideo.tags.length > 0 ? (
                      infoModalVideo.tags.map((tag: string, i: number) => (
                        <span key={i} className="text-[#BF76FF] font-bold">{tag}</span>
                      ))
                    ) : (
                      <span>{infoModalVideo.badge || "Série"}</span>
                    )}
                    <span className="border border-gray-600 px-1 rounded-sm">HD</span>
                  </div>
                  <p className="text-sm sm:text-lg text-gray-300 leading-relaxed max-w-3xl">
                    {infoModalVideo.description || "Assista a esta mensagem inspiradora da Igreja Batista Ministério Profecia."}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Vídeos Recentes Section */}
      <div id="videos" className="relative z-30 pb-20 px-4 md:px-12 overflow-visible">
        <div className="max-w-[1600px] mx-auto overflow-visible">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-[#BF76FF] rounded-full" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Vídeos Recentes</h2>
            </div>
            <button 
               onClick={() => navigate('/videos')}
               className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2 group"
            >
              Ver Tudo <ArrowRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-1")} />
            </button>
          </div>

          <div className="flex overflow-x-auto md:grid md:grid-cols-5 gap-4 mt-8 relative z-10 pb-4 snap-x snap-mandatory scrollbar-hide md:overflow-visible items-stretch"> {/** Grid de Vídeos */}
            {videos.length === 0 ? (
               Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="min-w-[85vw] md:min-w-0 md:w-auto shrink-0 snap-center aspect-video bg-white/5 rounded-md animate-pulse" />
               ))
            ) : (
              <>
                {(showAllVideos ? videos : videos.slice(0, 5)).map((video, idx) => (
                  <div key={`home-video-wrap-${idx}`} className="w-[85vw] sm:w-[45vw] md:w-auto shrink-0 snap-center md:snap-align-none">
                    <MovieCard 
                      key={`home-video-${idx}-${video.id || 'no-id'}`}
                      item={video}
                      type="video"
                      idx={idx}
                      onClick={() => handleWatchVideo(video)}
                      onAddToList={handleToggleMyList}
                      onFavorite={handleToggleFavorite}
                      onShowSimilar={handleShowSimilar}
                      isInList={myList.includes(video.id)}
                      isFavorited={isFavorite(video.id)}
                      showEffects={config.videoCardsEnabled}
                      hideTitleOnMobile={true}
                    />
                  </div>
                ))}
                {/* Mobile View All Card */}
                <div className="w-[85vw] sm:w-[45vw] md:hidden shrink-0 snap-center aspect-[16/9] bg-white/5 hover:bg-white/10 border border-white/10 rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors" onClick={() => navigate('/videos')}>
                  <div className="w-12 h-12 rounded-full bg-[#BF76FF]/20 flex items-center justify-center mb-3">
                    <ArrowRight className="w-6 h-6 text-[#BF76FF]" />
                  </div>
                  <span className="text-white font-bold text-sm tracking-widest uppercase">Ver Tudo</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Clicks Recentes Section */}
      {(() => {
        const recentClicksEvents = allEvents.filter(event => {
          return !event.hideFromClicks && (event.typeEvent === 'culto' || (event.gallery && event.gallery.length > 0));
        }).sort((a: any, b: any) => b.fullDate.getTime() - a.fullDate.getTime());

        return (
          <div id="lives" className="relative z-20 pb-20 px-4 md:px-12 overflow-visible">
            <div className="max-w-[1600px] mx-auto overflow-visible">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-red-500 rounded-full" />
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Clicks Recentes</h2>
                </div>
                <Link to="/galeria" className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2 group">
                  Ver Galeria <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="flex overflow-x-auto md:grid md:grid-cols-5 gap-4 mt-8 relative z-10 pb-4 snap-x snap-mandatory scrollbar-hide md:overflow-visible items-stretch"> {/** Grid de Cliques */}
                {recentClicksEvents.length === 0 ? (
                   Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="min-w-[85vw] md:min-w-0 md:w-auto shrink-0 snap-center aspect-video bg-white/5 rounded-md animate-pulse" />
                   ))
                ) : (
                  <>
                    {recentClicksEvents.slice(0, 5).map((event, idx) => (
                  <div key={`home-clique-wrap-${idx}`} className="w-[85vw] sm:w-[45vw] md:w-auto shrink-0 snap-center md:snap-align-none">
                    <MovieCard 
                      key={`home-clique-${idx}-${event.id}`}
                      item={event}
                      type="event"
                      idx={idx}
                      onClick={() => navigate('/galeria', { state: { selectedAlbumId: event.id } })}
                      onAddToList={handleToggleMyList}
                      onFavorite={handleToggleFavorite}
                      onShowSimilar={handleShowSimilar}
                      isInList={myList.includes(event.id)}
                      isFavorited={isFavorite(event.id)}
                      useGalleryImage={false}
                      hideTitleOnMobile={true}
                    />
                  </div>
                ))}
                {/* Mobile View All Card */}
                <div className="w-[85vw] sm:w-[45vw] md:hidden shrink-0 snap-center aspect-[16/9] bg-white/5 hover:bg-white/10 border border-white/10 rounded-md flex flex-col items-center justify-center cursor-pointer transition-colors" onClick={() => navigate('/galeria')}>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                     <ArrowRight className="w-6 h-6 text-red-500" />
                  </div>
                  <span className="text-white font-bold text-sm tracking-widest uppercase">Ver Galeria</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      );
      })()}

      {/* Eventos Section - Movie Style */}
      {(upcomingEvents.filter(e => e.typeEvent !== 'culto').length > 0 || pastEvents.filter(e => e.typeEvent !== 'culto').length > 0) && (
      <section className="py-24 px-4 md:px-12 bg-[#F8F9FB] rounded-t-[3.5rem] text-black relative z-10 -mt-10">
        <div className="max-w-[1400px] mx-auto">
          
          {/* Banners Promocionais */}
          {(config.homeBannerImage || config.homeBannerImage2 || config.homeBannerImage3) && (
            <div className="w-full mb-16 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {config.homeBannerImage && (
                config.homeBannerLink ? (
                  <a href={config.homeBannerLink} target="_blank" rel="noopener noreferrer" className="block w-full rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-1 bg-transparent aspect-[450/150] relative group">
                    <img src={config.homeBannerImage} alt="Promo 1" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <div className="w-full rounded-2xl overflow-hidden bg-transparent aspect-[450/150]">
                    <img src={config.homeBannerImage} alt="Promo 1" className="w-full h-full object-cover" />
                  </div>
                )
              )}
              {config.homeBannerImage2 ? (
                config.homeBannerLink2 ? (
                  <a href={config.homeBannerLink2} target="_blank" rel="noopener noreferrer" className="block w-full rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-1 bg-transparent aspect-[450/150] relative group">
                    <img src={config.homeBannerImage2} alt="Promo 2" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <div className="w-full rounded-2xl overflow-hidden bg-transparent aspect-[450/150]">
                    <img src={config.homeBannerImage2} alt="Promo 2" className="w-full h-full object-cover" />
                  </div>
                )
              ) : (
                <div className="w-full rounded-2xl overflow-hidden shadow-inner bg-black/5 border border-dashed border-black/10 aspect-[450/150] flex flex-col items-center justify-center text-center p-4">
                  <span className="text-sm font-bold text-gray-400 mb-1">Espaço para Banner 2</span>
                  <span className="text-xs text-gray-500">Adicione no painel Addmin (Ex: 450x150px)</span>
                </div>
              )}
              {config.homeBannerImage3 ? (
                config.homeBannerLink3 ? (
                  <a href={config.homeBannerLink3} target="_blank" rel="noopener noreferrer" className="block w-full rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-1 bg-transparent aspect-[450/150] relative group">
                    <img src={config.homeBannerImage3} alt="Promo 3" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ) : (
                  <div className="w-full rounded-2xl overflow-hidden bg-transparent aspect-[450/150]">
                    <img src={config.homeBannerImage3} alt="Promo 3" className="w-full h-full object-cover" />
                  </div>
                )
              ) : (
                <div className="w-full rounded-2xl overflow-hidden shadow-inner bg-black/5 border border-dashed border-black/10 aspect-[450/150] flex flex-col items-center justify-center text-center p-4">
                  <span className="text-sm font-bold text-gray-400 mb-1">Espaço para Banner 3</span>
                  <span className="text-xs text-gray-500">Adicione no painel Addmin (Ex: 450x150px)</span>
                </div>
              )}
            </div>
          )}

          {/* Upcoming Events Carousel/Banner */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1 h-8 bg-primary rounded-full" />
              <h2 className="text-3xl md:text-4xl tracking-tighter text-gray-900 font-['Helvetica_Neue',_Helvetica,_Arial,_sans-serif]">
                 <span className="font-light">Eventos</span>
              </h2>
            </div>
            
            <div className="relative h-[450px] md:h-[550px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-gray-100">
              <AnimatePresence mode="wait">
                {(() => {
                  const filteredPastEvents = pastEvents.filter(e => e.typeEvent !== 'culto');
                  const filteredUpcomingEvents = upcomingEvents.filter(e => e.typeEvent !== 'culto');
                  const allEventsSorted = [...filteredUpcomingEvents, ...filteredPastEvents];
                  const currentEvent = allEventsSorted[currentEventIndex % allEventsSorted.length];
                  if (!currentEvent) return null;
                  const isPast = currentEvent.fullDate < new Date().setHours(0,0,0,0);

                    return (
                      <motion.div
                        key={`hero-event-${currentEvent.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 cursor-pointer group"
                        onClick={() => navigate(`/evento/${currentEvent.id}`)}
                      >
                        <img 
                          src={getImageUrl(currentEvent.image)} 
                          alt={currentEvent.title}
                          className="w-full h-full object-cover opacity-100 transition-transform duration-[10s] ease-linear group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        
                        <div className="absolute top-8 left-8 flex flex-wrap gap-3">
                          <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                            {currentEvent.category}
                          </span>
                        </div>
                        
                        {currentEvent.neighborhood && (
                          <div className="absolute top-8 right-8 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 transition-all hover:bg-black/30 group/pin">
                            <MapPin className="w-3 h-3 text-white/60 group-hover/pin:text-primary transition-colors" />
                            <span className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em]">{currentEvent.neighborhood}</span>
                          </div>
                        )}

                        <div className="absolute bottom-12 left-12 right-12 max-w-2xl">
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <h3 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase leading-tight drop-shadow-lg">
                              {currentEvent.title}
                            </h3>
                            
                            <div className="flex items-center gap-4 flex-wrap">
                              <Button 
                                className="bg-white text-black hover:bg-gray-100 rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs flex items-center gap-2 group shadow-xl"
                              >
                                <Play className="w-4 h-4 fill-current" /> Ver Detalhes
                              </Button>

                              {isPast && (
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setIsFlashing(true);
                                    // Flash effect before navigating
                                    setTimeout(() => {
                                      setIsFlashing(false);
                                      navigate('/galeria', { state: { selectedAlbumId: currentEvent.id } });
                                    }, 300);
                                  }}
                                  className="bg-black text-white hover:bg-neutral-900 rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-xl border border-white/10"
                                >
                                  <Camera className="w-4 h-4 animate-bounce" /> Ver galeria de fotos
                                </Button>
                              )}

                              <button 
                                className={cn(
                                  "w-14 h-14 rounded-2xl backdrop-blur-md border border-white/20 flex items-center justify-center transition-all",
                                  isFavorite(currentEvent.id) ? "bg-red-500 text-white border-red-500" : "bg-white/10 text-white hover:bg-white/20"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(e, {
                                    id: currentEvent.id,
                                    title: currentEvent.title,
                                    thumbnail: currentEvent.image,
                                    published: currentEvent.date,
                                    link: `/evento/${currentEvent.id}`,
                                    category: "event"
                                  });
                                }}
                              >
                                <Heart className={cn("w-5 h-5", isFavorite(currentEvent.id) && "fill-current")} />
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            </div>

          {/* Past Events Grid */}
          <div className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <h2 className="text-2xl md:text-3xl tracking-tighter text-gray-900 font-['Helvetica_Neue',_Helvetica,_Arial,_sans-serif]">
                  <span className="font-light">Últimos</span> <span className="font-bold">eventos</span>
                </h2>
              </div>
              <Link to="/galeria" className="text-xs font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">
                Ver Galeria Completa
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 overflow-visible">
              {(pastEvents.length > 0 ? pastEvents : []).filter(e => e.typeEvent !== 'culto').slice(0, 4).map((event, idx) => (
                <MovieCard 
                  key={`past-event-${event.id}-${idx}`}
                  item={event}
                  type="event"
                  idx={idx}
                  onClick={() => navigate(`/evento/${event.id}`)}
                  onAddToList={handleToggleMyList}
                  onFavorite={handleToggleFavorite}
                  onShowSimilar={handleShowSimilar}
                  isInList={myList.includes(event.id)}
                  isFavorited={isFavorite(event.id)}
                  hideTitleOnMobile={true}
                />
              ))}
            </div>
          </div>

          {/* Vem aí Section */}
          {upcomingEvents.filter(e => e.typeEvent !== 'culto').length > 0 && (
            <div className="mb-20">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <h2 className="text-2xl md:text-3xl tracking-tighter text-gray-900 font-['Helvetica_Neue',_Helvetica,_Arial,_sans-serif]">
                  <span className="font-light">Vem</span> <span className="font-bold">aí!</span>
                </h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 overflow-visible">
                {upcomingEvents.filter(e => e.typeEvent !== 'culto').slice(0, 4).map((event, idx) => (
                  <MovieCard 
                    key={`upcoming-event-${event.id}-${idx}`}
                    item={event}
                    type="event"
                    idx={idx}
                    onClick={() => navigate(`/evento/${event.id}`)}
                    onAddToList={handleToggleMyList}
                    onFavorite={handleToggleFavorite}
                    onShowSimilar={handleShowSimilar}
                    isInList={myList.includes(event.id)}
                    isFavorited={isFavorite(event.id)}
                    hideTitleOnMobile={true}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
      )}

      {/* Blog/Notícias Section - Estilo Portal de Notícias (Mosaico) */}
      <section className="py-24 px-4 md:px-12 bg-white text-black relative hover:z-[70] transition-[z-index] duration-0">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-[#c4170c] rounded-full" />
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase font-['Inter',_sans-serif]">Notícias Profetizadas</h2>
              </div>
              <p className="text-gray-500 font-medium ml-4 uppercase tracking-[0.2em] text-[10px]">Acompanhe os fatos que marcaram o Reino</p>
            </div>
            <Link to="/noticias" className="hidden md:flex items-center gap-2 text-sm font-black text-[#c4170c] uppercase tracking-widest hover:underline decoration-2 underline-offset-8">
              Portal Completo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-4 md:h-[800px]">
            {/* Main Featured News (Large Left) */}
            {blogPosts.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="md:col-span-8 md:row-span-2 group relative overflow-hidden rounded-2xl cursor-pointer shadow-xl"
                onClick={() => navigate(`/noticia/${blogPosts[0].id}`)}
              >
                <img 
                  src={getImageUrl(blogPosts[0].image)} 
                  alt={blogPosts[0].title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-[#c4170c] text-white text-[10px] font-black px-4 py-2 rounded-md uppercase tracking-widest">DESTAQUE</span>
                    <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">{blogPosts[0].date}</span>
                  </div>
                  <h3 className="text-3xl md:text-5xl font-black text-white leading-[0.9] tracking-tighter uppercase group-hover:translate-x-2 transition-transform duration-500">
                    {blogPosts[0].title}
                  </h3>
                </div>
              </motion.div>
            )}

            {/* Sidebar Top (Right) */}
            {blogPosts.length > 1 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="md:col-span-4 group relative overflow-hidden rounded-2xl cursor-pointer shadow-lg"
                onClick={() => navigate(`/noticia/${blogPosts[1].id}`)}
              >
                <img 
                  src={getImageUrl(blogPosts[1].image)} 
                  alt={blogPosts[1].title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                   <span className="text-[#BF76FF] text-[10px] font-black uppercase tracking-widest block mb-2">{blogPosts[1].date}</span>
                   <h4 className="text-xl md:text-2xl font-black text-white leading-tight uppercase tracking-tighter group-hover:text-[#BF76FF] transition-colors">
                     {blogPosts[1].title}
                   </h4>
                </div>
              </motion.div>
            )}

            {/* Sidebar Bottom (Right) */}
            {blogPosts.slice(2, 4).length > 0 && (
              <div className="md:col-span-4 grid grid-cols-2 gap-4">
                {blogPosts.slice(2, 4).map((post, idx) => (
                  <motion.div 
                    key={`blog-sub-${post.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative aspect-square overflow-hidden rounded-2xl group cursor-pointer shadow-md bg-gray-100"
                    onClick={() => navigate(`/noticia/${post.id}`)}
                  >
                    <img 
                      src={getImageUrl(post.image)} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                       <h5 className="text-xs md:text-sm font-black text-white leading-tight uppercase tracking-tighter line-clamp-3">
                         {post.title}
                       </h5>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Venha nos Visitar Section */}
      <section id="localizacao" className="py-24 px-4 md:px-12 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter uppercase text-white">
                Venha nos <span className="text-primary">Visitar</span>
              </h2>
              <p className="text-white text-lg mb-12 leading-relaxed opacity-80">
                Nossa igreja é um lugar de acolhimento e transformação. Junte-se a nós em um de nossos cultos presenciais e experimente o poder de Deus em comunidade.
              </p>
              
              <div className="space-y-6">
                {[
                  { day: "Ter", title: "Culto de Oração", detail: "Terça-feira às ", time: "19:30h" },
                  { day: "Sex", title: "Culto de Libertação", detail: "Sexta-feira às ", time: "19:30h" },
                  { day: "Dom", title: "Culto da Família", detail: "Domingo às ", time: "19:00h" }
                ].map((item, i) => (
                  <div key={`link-card-${i}`} className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-primary font-black text-xs uppercase">{item.day}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{item.title}</h4>
                      <p className="text-white/40 text-sm">
                        {item.detail}
                        <span className="font-black text-white/90">{item.time}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3705.518608226019!2d-43.3888365!3d-21.7513077!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x989b5c39a3f2d9%3A0x7d6f5c8e3c8e3c8e!2sR.%20Cleonice%20Rainho%2C%2019%20-%20Aeroporto%2C%20Juiz%20de%20Fora%20-%20MG%2C%2036038-250!5e0!3m2!1spt-BR!2sbr!4v1713560000000!5m2!1spt-BR!2sbr" 
                className="w-full h-full border-0" 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <Button 
                  onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=Ministério+Profecia+Juiz+de+Fora', '_blank')}
                  className="w-full bg-white text-black hover:bg-white/90 rounded-xl h-14 font-bold text-lg"
                >
                  Me leve até lá
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter/CTA Section */}
      <section className="py-24 px-4 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter uppercase">
              Fique por dentro de <span className="text-primary">Tudo</span>
            </h2>
            <p className="text-white/60 text-lg mb-12">
              Receba avisos de lives, novos estudos e eventos especiais diretamente no seu e-mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <input 
                type="email" 
                placeholder="Seu melhor e-mail" 
                className="flex-grow bg-white/5 border border-white/10 rounded-xl px-6 h-14 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 h-14 font-bold">
                Inscrever
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Similar Videos Modal */}
      <AnimatePresence>
        {showSimilarModal && activeSimilarVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-md"
            onClick={() => setShowSimilarModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#181818] w-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative p-6 md:p-8 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-primary/20 to-transparent">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter">
                      Vídeos Semelhantes
                    </h3>
                  </div>
                  <p className="text-gray-400 text-sm font-medium">
                    Explorando conteúdos relacionados a: <span className="text-white font-bold">{activeSimilarVideo.title}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setShowSimilarModal(false)}
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all hover:rotate-90"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-[#141414]">
                {similarVideos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {similarVideos.map((item, idx) => (
                      <div key={`similar-${item.id}-${idx}`} className="group/item">
                        <MovieCard
                          item={item}
                          type="video"
                          idx={idx}
                          onClick={() => {
                            setShowSimilarModal(false);
                            handleWatchVideo(item);
                          }}
                          onAddToList={handleToggleMyList}
                          onFavorite={handleToggleFavorite}
                          onShowSimilar={handleShowSimilar}
                          isInList={myList.includes(item.id)}
                          isFavorited={isFavorite(item.id)}
                          isSimilarCard={true}
                          hideTitleOnMobile={true}
                        />
                        <div className="mt-4 hidden sm:block sm:opacity-0 group-hover/item:opacity-100 transition-opacity text-left">
                           <h4 className="text-white font-bold text-sm line-clamp-1">{item.title}</h4>
                           <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-32 text-center flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                       <Youtube className="w-10 h-10 text-white/20" />
                    </div>
                    <p className="text-gray-400 font-medium text-lg">Nenhum vídeo semelhante encontrado com esta tag.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4 border-white/10 text-white hover:bg-white/5"
                      onClick={() => setShowSimilarModal(false)}
                    >
                      Voltar ao Início
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#181818] w-full max-w-md rounded-3xl p-8 border border-white/10 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary"></div>
              
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Heart className="w-10 h-10 text-primary" />
              </div>
              
              <h2 className="text-3xl font-black text-white mb-2">Bem vindo, {profile?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || "Visitante"}!</h2>
              <p className="text-gray-400 text-lg mb-8">É uma benção ter você aqui!</p>
              
              <Button 
                onClick={handleWelcomeClose}
                className="w-full bg-primary hover:bg-primary/80 text-white rounded-xl h-14 font-bold text-lg"
              >
                Continuar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LGPD Modal */}
      <AnimatePresence>
        {showLgpdModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#181818] w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col border border-white/10 shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 shrink-0">
                <h2 className="text-2xl font-black text-white uppercase flex items-center gap-2">
                  Termo de Responsabilidade e Consentimento
                  <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">LGPD</span>
                </h2>
              </div>
              
      <div className="flex-1 overflow-y-auto p-6 text-gray-300 text-sm space-y-4 custom-scrollbar">
                <div className="space-y-4">
                  <div><strong>1. Coleta de Dados Pessoais</strong><br/>Ao acessar a plataforma como visitante e fornecer voluntariamente seus dados, incluindo nome e telefone, o usuário declara estar ciente de que essas informações serão coletadas e armazenadas pela empresa responsável.</div>
                  
                  <div className="space-y-1"><strong>2. Finalidade do Uso dos Dados</strong><br/>Os dados fornecidos serão utilizados exclusivamente para:
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                      <li>Identificação do usuário;</li>
                      <li>Contato futuro para atendimento, suporte, informações comerciais ou institucionais;</li>
                      <li>Melhoria da experiência do usuário nos serviços oferecidos.</li>
                    </ul>
                  </div>

                  <div><strong>3. Consentimento</strong><br/>Ao fornecer seus dados e prosseguir com o uso da plataforma, o usuário autoriza expressamente, de forma livre, informada e inequívoca, o tratamento de seus dados pessoais para as finalidades descritas neste termo, in conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).</div>

                  <div className="space-y-1"><strong>4. Compartilhamento de Dados</strong><br/>Os dados não serão vendidos ou compartilhados com terceiros, exceto quando necessário para:
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                      <li>Cumprimento de obrigações legais;</li>
                      <li>Execução de serviços essenciais vinculados à operação da plataforma;</li>
                      <li>Mediante consentimento adicional do usuário.</li>
                    </ul>
                  </div>

                  <div><strong>5. Armazenamento e Segurança</strong><br/>A empresa se compromete a adotar medidas técnicas e administrativas adequadas para proteger os dados pessoais contra acessos não autorizados, vazamentos, perdas ou qualquer forma de tratamento inadequado.</div>

                  <div className="space-y-1"><strong>6. Direitos do Titular dos Dados</strong><br/>O usuário poderá, a qualquer momento, solicitar:
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                      <li>Acesso aos seus dados;</li>
                      <li>Correção de dados incompletos ou desatualizados;</li>
                      <li>Exclusão dos dados pessoais;</li>
                      <li>Revogação do consentimento.</li>
                    </ul>
                    <span className="block mt-2">As solicitações poderão ser feitas por meio de canal de atendimento disponibilizado pela empresa.</span>
                  </div>

                  <div><strong>7. Retenção dos Dados</strong><br/>Os dados serão armazenados pelo tempo necessário para cumprir as finalidades descritas neste termo ou conforme exigido por obrigações legais.</div>

                  <div><strong>8. Aceite do Termo</strong><br/>Ao fornecer seus dados e continuar utilizando a plataforma, o usuário declara que leu, compreendeu e concorda integralmente com este Termo de Responsabilidade e Consentimento.</div>

                  <div className="text-gray-500 font-mono text-xs pt-4 border-t border-white/10 mt-6">Última atualização: 01/05/2026</div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 shrink-0 bg-black/20">
                <Button 
                  onClick={handleLgpdAccept}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl h-14 font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Check className="w-6 h-6" />
                  Concordar e Continuar
                </Button>
                <p className="text-center text-[10px] text-gray-500 mt-4 uppercase tracking-widest">
                  Ao clicar no botão acima, você aceita o termo.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
