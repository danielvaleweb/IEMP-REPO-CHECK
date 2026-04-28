import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Heart, 
  Share2, 
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
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/contexts/FavoritesContext";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, doc } from "firebase/firestore";

export default function Home() {
  const navigate = useNavigate();
  const [isLive, setIsLive] = useState(false);
  const [nextService, setNextService] = useState("Domingo às 19:00");
  const [videos, setVideos] = useState<any[]>([]);
  const [lives, setLives] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [settings, setSettings] = useState<any>({ enableHeaderVideos: true });
  const { toggleFavorite, isFavorite } = useFavorites();
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);
        if (data.nextService) {
          setNextService(data.nextService);
        }
      }
    }, (err) => console.error("Error loading settings:", err));
    return () => unsubSettings();
  }, []);

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
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allEvents = snapshot.docs.map(doc => {
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
          rating: "5.0" // Fixed rating instead of random to look more professional
        };
      }).filter(e => e.title && e.title.trim() !== "");

      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today

      const upcoming = allEvents
        .filter(e => e.fullDate >= now)
        .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
      
      const past = allEvents
        .filter(e => e.fullDate < now)
        .sort((a, b) => b.fullDate.getTime() - a.fullDate.getTime());

      setUpcomingEvents(upcoming);
      setPastEvents(past);
    }, (err) => console.error("Error loading events:", err));

    const unsubscribeBlog = onSnapshot(query(collection(db, "blog"), limit(6)), (snap) => {
      setBlogPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Error loading blog posts:", err));

    return () => {
      unsubscribe();
      unsubscribeBlog();
    };
  }, []);

  useEffect(() => {
    // Only attempt to fetch when settings are available
    const configChannelId = settings.youtubeChannelId || "UCILgaItnqDH3plhRXD54QUg";
    const configHandle = settings.youtubeHandle || "@ministerio_profecia";

    const fetchFromRSS2JSON = async (chId: string, filterType?: 'videos' | 'lives') => {
      let cleanId = chId.trim();
      if (cleanId.startsWith('@')) {
        // We can't easily resolve handle to ID on client due to CORS, 
        // so we hope the backend worked or the channel ID was provided.
        // If it's the known handle, use the known UC ID
        if (cleanId === "@ministerio_profecia") cleanId = "UCILgaItnqDH3plhRXD54QUg";
      } else if (cleanId.includes('youtube.com/@')) {
        const handle = '@' + cleanId.split('youtube.com/@')[1].split('/')[0].split('?')[0];
        if (handle === "@ministerio_profecia") cleanId = "UCILgaItnqDH3plhRXD54QUg";
      } else if (cleanId.includes('youtube.com/channel/')) {
        cleanId = cleanId.split('youtube.com/channel/')[1].split('/')[0].split('?')[0];
      }
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${cleanId}`;
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`);
      const data = await response.json();
      if (data.status === "ok" && data.items) {
        let filteredItems = data.items;
        
        if (filterType) {
          filteredItems = data.items.filter((item: any) => {
            const t = (item.title || "").toLowerCase();
            const isLive = t.includes('culto') || t.includes('ao vivo') || t.includes('podcast') || t.includes('live') || t.includes('transmissão') || t.includes('vigília');
            if (filterType === 'videos') return !isLive;
            if (filterType === 'lives') return isLive;
            return true;
          });
        }
        
        // If strict filtering didn't return anything (maybe naming convention changed), fallback to unfiltered
        if (filteredItems.length === 0) {
           filteredItems = data.items;
        }

        const mappedItems = filteredItems.map((item: any) => {
          const videoId = item.guid.replace('yt:video:', '');
          return {
            id: videoId,
            title: item.title,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            published: new Date(item.pubDate).toLocaleDateString('pt-BR'),
            link: item.link
          };
        });
        
        return mappedItems.slice(0, 10);
      }
      throw new Error("RSS2JSON failed");
    };

    const fetchVideos = async () => {
      try {
        const response = await fetch(`/backend/recent-videos?channelId=${configChannelId}`);
        if (!response.ok) throw new Error("Failed to fetch videos");
        
        const text = await response.text();
        if (text.trim().startsWith('<')) throw new Error("Backend not available, returned HTML");
        const data = JSON.parse(text);
        
        if (data && data.length > 0) {
          setVideos(data);
        } else {
          // If the backend API explicitly returns an empty array, we can try RSS2JSON as a fallback gently 
          // or just show placeholders without throwing generic errors.
          console.warn("Backend returned empty videos array. Checking fallback.");
          try {
            const fallbackData = await fetchFromRSS2JSON(configChannelId, 'videos');
            if (fallbackData && fallbackData.length > 0) {
              setVideos(fallbackData);
              return;
            }
          } catch (e) {
            // ignore
          }
          throw new Error("No videos found");
        }
      } catch (error) {
        console.warn("Using placeholder videos because no YouTube content was found or configured.");
        
        setVideos([
          {
            id: "channel_fallback_1",
            isPlaceholder: true,
            title: "Configure seu Canal no Painel Admin",
            thumbnail: "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&q=80&w=1920",
            published: new Date().toISOString(),
            link: `https://www.youtube.com/${configHandle}/videos`
          },
          {
            id: "channel_fallback_2",
            isPlaceholder: true,
            title: "Acesse o Dashboard para carregar seus vídeos",
            thumbnail: "https://images.unsplash.com/photo-1510590337019-5ef8d3d32116?auto=format&fit=crop&q=80&w=1920",
            published: new Date().toISOString(),
            link: `https://www.youtube.com/${configHandle}/videos`
          }
        ]);
      }
    };

    const fetchLives = async () => {
      try {
        const response = await fetch(`/backend/recent-lives?channelId=${configChannelId}`);
        if (!response.ok) throw new Error("Failed to fetch lives");
        
        const text = await response.text();
        if (text.trim().startsWith('<')) throw new Error("Backend not available, returned HTML");
        const data = JSON.parse(text);
        
        if (data && data.length > 0) {
          setLives(data);
        } else {
          // If live array is empty, we don't throw, just set empty to avoid the "Failed" message
          setLives([]);
        }
      } catch (error) {
        console.warn("Could not fetch YouTube lives. Checking fallback.");
        try {
          // Fallback to RSS data for lives too if backend is missing
          const fallbackData = await fetchFromRSS2JSON(configChannelId, 'lives');
          if (fallbackData && fallbackData.length > 0) {
            setLives(fallbackData);
            return;
          } else {
            setLives([]);
            return;
          }
        } catch (rssError) {
          setLives([]);
        }
      }
    };

    fetchVideos();
    fetchLives();
    
    // Check if live
    const checkLive = async () => {
      try {
        const response = await fetch(`/backend/live-status?channelId=${configChannelId}&handle=${configHandle}`);
        if (response.ok) {
          const data = await response.json();
          setIsLive(data.isLive);
        } else {
          setIsLive(false);
        }
      } catch (error) {
        // Silent fail for live status checking
        setIsLive(false);
      }
    };
    checkLive();
    const interval = setInterval(checkLive, 60000);
    return () => clearInterval(interval);
  }, [settings.youtubeChannelId, settings.youtubeHandle]);

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
    // Avoid autoplaying background iframe on mobile devices to prevent YouTube bot verification prompt
    if (window.innerWidth <= 768) {
      setShowVideo(false);
      return;
    }

    if (settings.enableHeaderVideos === false) {
      setShowVideo(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowVideo(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [currentIndex, settings.enableHeaderVideos]);

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
    setSelectedVideo(video);
    setIsWatching(true);
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
                      src={`https://www.youtube-nocookie.com/embed/${videos[currentIndex].id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videos[currentIndex].id}&start=600&modestbranding=1&rel=0&origin=${window.location.origin}`}
                      className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2 border-none scale-105"
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                ) : (
                  <img
                    src={videos[currentIndex].thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
              </div>

              {/* Content Overlay */}
              <div className="relative z-10 h-full flex flex-col justify-end items-start text-left px-6 md:px-16 pb-24 md:pb-32">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="max-w-3xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider shadow-lg">
                      {isLive && currentIndex === 0 ? "Ao Vivo" : "Gravado"}
                    </span>
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
                      className="bg-black/40 backdrop-blur-md border-white/20 text-white hover:bg-white/20 rounded-md px-8 h-12 text-lg font-bold"
                      onClick={() => {
                        const video = videos[currentIndex];
                        const isMusic = video.title.toLowerCase().includes("louvor") || 
                                       video.title.toLowerCase().includes("música") || 
                                       video.title.toLowerCase().includes("hino");
                        toggleFavorite({
                          ...video,
                          category: isMusic ? "music" : "video"
                        });
                      }}
                    >
                      {isFavorite(videos[currentIndex].id) ? <Heart className="w-6 h-6 fill-red-500 stroke-red-500" /> : <Heart className="w-6 h-6" />}
                      {isFavorite(videos[currentIndex].id) ? "Favoritado" : "Minha Lista"}
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
              className="fixed inset-0 z-[100] bg-black"
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
                className="absolute top-8 right-8 text-white hover:bg-white/10 rounded-full z-[110]"
                onClick={() => setIsWatching(false)}
              >
                <X className="w-8 h-8" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Vídeos Recentes Section */}
      <div className="relative z-20 pb-20 px-4 md:px-12 bg-black">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-[#BF76FF] rounded-full" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Vídeos Recentes</h2>
            </div>
            <Link to="/galeria" className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2 group">
              Ver Tudo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="flex overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-5 gap-4 md:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {videos.slice(0, 5).map((video, idx) => (
              <motion.div
                key={`home-video-${idx}-${video.id || 'no-id'}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer min-w-[65%] sm:min-w-[45%] md:min-w-0 snap-start"
                onClick={() => handleWatchVideo(video)}
              >
                <div className="relative aspect-video rounded-lg overflow-hidden mb-3 border border-white/5">
                  {video.isPlaceholder ? (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-6 text-center gap-2">
                      <Youtube className="w-8 h-8 text-white/20" />
                      <span className="text-[10px] text-white/40 uppercase tracking-widest leading-tight">Configuração Pendente</span>
                    </div>
                  ) : (
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      {video.isPlaceholder ? <ExternalLink className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white fill-current" />}
                    </div>
                    <button 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isFavorite(video.id) ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        const isMusic = video.title.toLowerCase().includes("louvor") || 
                                       video.title.toLowerCase().includes("música") || 
                                       video.title.toLowerCase().includes("hino");
                        toggleFavorite({
                          ...video,
                          category: isMusic ? "music" : "video"
                        });
                      }}
                    >
                      <Heart className={cn("w-5 h-5", isFavorite(video.id) && "fill-current")} />
                    </button>
                  </div>
                </div>
                <h3 className={cn(
                  "text-sm font-bold line-clamp-2 transition-colors",
                  video.isPlaceholder ? "text-white/60 italic" : "text-white group-hover:text-[#BF76FF]"
                )}>
                  {cleanTitle(video.title)}
                </h3>
                <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">
                  {formatVideoDate(video.published)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Lives Recentes Section */}
      <div className="relative z-20 pb-20 px-4 md:px-12 bg-black">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-red-500 rounded-full" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Lives Recentes</h2>
            </div>
          </div>

          {lives.length === 0 ? (
            <div className="text-white/40 text-sm">Nenhuma live recente encontrada.</div>
          ) : (
            <div className="flex overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-5 gap-4 md:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {lives.slice(0, 5).map((life, idx) => (
                <motion.div
                  key={`home-life-${idx}-${life.id || 'no-id'}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group cursor-pointer min-w-[65%] sm:min-w-[45%] md:min-w-0 snap-start"
                  onClick={() => handleWatchVideo(life)}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-3 border border-white/5">
                    {life.isPlaceholder ? (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-6 text-center gap-2">
                        <Youtube className="w-8 h-8 text-white/20" />
                        <span className="text-[10px] text-white/40 uppercase tracking-widest leading-tight">Configuração Pendente</span>
                      </div>
                    ) : (
                      <img 
                        src={life.thumbnail} 
                        alt={life.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        {life.isPlaceholder ? <ExternalLink className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white fill-current" />}
                      </div>
                      <button 
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                          isFavorite(life.id) ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite({
                            ...life,
                            category: "video"
                          });
                        }}
                      >
                        <Heart className={cn("w-5 h-5", isFavorite(life.id) && "fill-current")} />
                      </button>
                    </div>
                  </div>
                  <h3 className={cn(
                    "text-sm font-bold line-clamp-2 transition-colors",
                    life.isPlaceholder ? "text-white/60 italic" : "text-white group-hover:text-red-500"
                  )}>
                    {cleanTitle(life.title)}
                  </h3>
                  <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">
                    {formatVideoDate(life.published)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Eventos Section - Movie Style */}
      <section className="py-24 px-4 md:px-12 bg-[#F8F9FB] rounded-t-[3.5rem] text-black relative z-30 -mt-10">
        <div className="max-w-[1400px] mx-auto">
          
          {/* Upcoming Events Carousel/Banner */}
          {(upcomingEvents.length > 0 || pastEvents.length > 0) && (
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
                    const allEventsSorted = [...upcomingEvents, ...pastEvents];
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
                          src={currentEvent.image} 
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
                                      navigate(`/evento/${currentEvent.id}#galeria`);
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
                                  toggleFavorite({
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
          )}

          {/* Past Events Grid */}
          <div className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <h2 className="text-2xl md:text-3xl tracking-tighter text-gray-900 font-['Helvetica_Neue',_Helvetica,_Arial,_sans-serif]">
                  <span className="font-light">Últimos</span> <span className="font-bold">eventos</span>
                </h2>
              </div>
              <Link to="/eventos" className="text-xs font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">
                Ver Galeria Completa
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {(pastEvents.length > 0 ? pastEvents : []).slice(0, 4).map((event, idx) => (
                <motion.div
                  key={`past-event-${event.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/evento/${event.id}`)}
                >
                  <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 bg-white">
                    <img 
                      src={event.image || "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&q=80&w=800"} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&q=80&w=800"; }}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Vem aí Section */}
          {upcomingEvents.length > 0 && (
            <div className="mb-20">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <h2 className="text-2xl md:text-3xl tracking-tighter text-gray-900 font-['Helvetica_Neue',_Helvetica,_Arial,_sans-serif]">
                  <span className="font-light">Vem</span> <span className="font-bold">aí!</span>
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {upcomingEvents.slice(0, 4).map((event, idx) => (
                  <motion.div
                    key={`upcoming-event-${event.id}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/evento/${event.id}`)}
                  >
                    <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 bg-white">
                      <img 
                        src={event.image || "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&q=80&w=800"} 
                        alt={event.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&q=80&w=800"; }}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Blog/Notícias Section - Estilo Portal de Notícias (Mosaico) */}
      <section className="py-24 px-4 md:px-12 bg-white text-black relative z-30">
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
                  src={blogPosts[0].image} 
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
                  src={blogPosts[1].image} 
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
                      src={post.image} 
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

      {/* Próximos Cultos Section */}
      <section className="py-24 px-4 md:px-12 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter uppercase">
                Venha nos <span className="text-primary">Visitar</span>
              </h2>
              <p className="text-white/60 text-lg mb-12 leading-relaxed">
                Nossa igreja é um lugar de acolhimento e transformação. Junte-se a nós em um de nossos cultos presenciais e experimente o poder de Deus em comunidade.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: Calendar, title: "Culto de Celebração", detail: "Domingos às 19:00" },
                  { icon: Clock, title: "Culto de Oração", detail: "Terças às 20:00" },
                  { icon: MapPin, title: "Endereço", detail: "Rua Exemplo, 123 - Cidade/UF" }
                ].map((item, i) => (
                  <div key={`link-card-${i}`} className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{item.title}</h4>
                      <p className="text-white/40 text-sm">{item.detail}</p>
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
              <img 
                src="https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&q=80&w=1000" 
                alt="Igreja" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <Button className="w-full bg-white text-black hover:bg-white/90 rounded-xl h-14 font-bold text-lg">
                  Como Chegar
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
    </div>
  );
}
