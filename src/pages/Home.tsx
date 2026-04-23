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
  Tag
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
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [settings, setSettings] = useState<any>({ enableHeaderVideos: true });
  const { toggleFavorite, isFavorite } = useFavorites();

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
    return title.replace(/[0-9\/]/g, '').trim();
  };

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20));
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
        let eventDate = new Date();
        if (displayDate) {
          const dateParts = displayDate.split('/');
          if (dateParts.length >= 2) {
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const year = dateParts.length === 3 ? parseInt(dateParts[2]) : new Date().getFullYear();
            eventDate = new Date(year, month, day);
            
            // If it's a past year and it's DD/MM, it might be for next year if the month has passed
            // But for church events, usually we just use the current year if not specified.
          }
        }

        return {
          id: doc.id,
          title: data.title,
          description: data.content,
          date: displayDate,
          time: displayTime,
          category: data.organization || "Evento",
          image: data.image || `https://picsum.photos/seed/${doc.id}/1200/600`,
          fullDate: eventDate,
          invitedMembers: data.invitedMembers || [],
          neighborhood: data.neighborhood || "",
          rating: "5.0" // Fixed rating instead of random to look more professional
        };
      });

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

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Only attempt to fetch when settings are available
    const configChannelId = settings.youtubeChannelId || "UCILgaItnqDH3plhRXD54QUg";
    const configHandle = settings.youtubeHandle || "@ministerio_profecia";

    const fetchVideos = async () => {
      try {
        const response = await fetch(`/api/recent-videos?channelId=${configChannelId}`);
        if (!response.ok) throw new Error("Failed to fetch videos");
        const data = await response.json();
        
        if (data && data.length > 0) {
          const uniqueVideos = Array.from(new Map(data.map((v: any) => [v.id, v])).values());
          setVideos(uniqueVideos);
        } else {
          throw new Error("Empty videos array");
        }
      } catch (error) {
        console.error("Error fetching videos, using fallbacks:", error);
        setVideos([
          {
            id: "channel_fallback_1",
            title: "Culto de Celebração (Assista no Canal)",
            thumbnail: "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&q=80&w=1920",
            published: new Date().toISOString(),
            link: `https://www.youtube.com/${configHandle}/videos`
          },
          {
            id: "channel_fallback_2",
            title: "Momento de Oração",
            thumbnail: "https://images.unsplash.com/photo-1510590337019-5ef8d3d32116?auto=format&fit=crop&q=80&w=1920",
            published: new Date().toISOString(),
            link: `https://www.youtube.com/${configHandle}/videos`
          }
        ]);
      }
    };

    const fetchLives = async () => {
      try {
        const response = await fetch(`/api/recent-lives?channelId=${configChannelId}`);
        if (!response.ok) throw new Error("Failed to fetch lives");
        const data = await response.json();
        
        if (data && data.length > 0) {
          const uniqueLives = Array.from(new Map(data.map((v: any) => [v.id, v])).values());
          setLives(uniqueLives);
        } else {
          // Add default fallback inside the try block gracefully
          setLives([
            {
              id: "live_fallback_1",
              title: "Culto Ao Vivo (Acesse o Canal)",
              thumbnail: "https://picsum.photos/seed/live1/1920/1080",
              published: new Date().toISOString(),
              link: `https://www.youtube.com/${configHandle}/live`
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching lives:", error);
        // Fallback dummy data if endpoint completely fails
        setLives([
          {
            id: "live_fallback_error",
            title: "Transmissão Encerrada",
            thumbnail: "https://picsum.photos/seed/liveerror/1920/1080",
            published: new Date().toISOString(),
            link: `https://www.youtube.com/${configHandle}/live`
          }
        ]);
      }
    };

    fetchVideos();
    fetchLives();
    
    // Check if live
    const checkLive = async () => {
      try {
        const response = await fetch(`/api/live-status?channelId=${configChannelId}&handle=${configHandle}`);
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

  // Auto-play carousel every 30 seconds
  useEffect(() => {
    if (videos.length === 0) return;
    const timer = setInterval(() => {
      nextVideo();
    }, 30000);
    return () => clearInterval(timer);
  }, [nextVideo, videos.length]);

  // Show video after 3 seconds of slide change
  useEffect(() => {
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
      {/* Hero Section - Netflix Style */}
      <section id="hero" className="relative min-h-[80vh] md:h-screen w-full bg-black text-white overflow-visible"> {/** Removido overflow-hidden para permitir scroll mais natural */}
        <AnimatePresence mode="wait">
          {videos[currentIndex] && (
            <motion.div
              key={videos[currentIndex].id}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {videos.slice(0, 5).map((video, idx) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer"
                onClick={() => handleWatchVideo(video)}
              >
                <div className="relative aspect-video rounded-lg overflow-hidden mb-3 border border-white/5">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-current" />
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
                <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-[#BF76FF] transition-colors">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {lives.slice(0, 5).map((life, idx) => (
                <motion.div
                  key={life.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => handleWatchVideo(life)}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-3 border border-white/5">
                    <img 
                      src={life.thumbnail} 
                      alt={life.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-current" />
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
                  <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-red-500 transition-colors">
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
          
          {/* Upcoming Event (Large Banner) */}
          {upcomingEvents.length > 0 && (
            <div className="mb-20">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1 h-8 bg-primary rounded-full" />
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Próximas Experiências</h2>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative h-[450px] md:h-[550px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl group cursor-pointer"
                onClick={() => navigate(`/evento/${upcomingEvents[0].id}`)}
              >
                <img 
                  src={upcomingEvents[0].image} 
                  alt={upcomingEvents[0].title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                <div className="absolute top-8 left-8 flex flex-wrap gap-3">
                  <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20">
                    {upcomingEvents[0].category}
                  </span>
                  <span className="bg-primary/90 px-4 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                    DESTAQUE
                  </span>
                </div>
                
                {upcomingEvents[0].neighborhood && (
                  <div className="absolute top-8 right-8 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 transition-all hover:bg-black/30 group/pin">
                    <MapPin className="w-3 h-3 text-white/60 group-hover/pin:text-primary transition-colors" />
                    <span className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em]">{upcomingEvents[0].neighborhood}</span>
                  </div>
                )}

                <div className="absolute bottom-12 left-12 right-12 max-w-2xl">
                  <h3 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tighter uppercase leading-tight drop-shadow-lg">
                    {upcomingEvents[0].title}
                  </h3>
                  <p className="text-white/70 text-lg md:text-xl font-medium mb-8 line-clamp-2 drop-shadow-md">
                    {upcomingEvents[0].description}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <Button 
                      className="bg-white text-black hover:bg-gray-100 rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs flex items-center gap-2 group shadow-xl"
                    >
                      <Play className="w-4 h-4 fill-current" /> Ver Detalhes
                    </Button>
                    <button 
                      className={cn(
                        "w-14 h-14 rounded-2xl backdrop-blur-md border border-white/20 flex items-center justify-center transition-all",
                        isFavorite(upcomingEvents[0].id) ? "bg-red-500 text-white border-red-500" : "bg-white/10 text-white hover:bg-white/20"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite({
                          id: upcomingEvents[0].id,
                          title: upcomingEvents[0].title,
                          thumbnail: upcomingEvents[0].image,
                          published: upcomingEvents[0].date,
                          link: `/evento/${upcomingEvents[0].id}`,
                          category: "event"
                        });
                      }}
                    >
                      <Heart className={cn("w-5 h-5", isFavorite(upcomingEvents[0].id) && "fill-current")} />
                    </button>
                    
                    <div className="hidden md:flex ml-auto items-center gap-2">
                       <div className="flex -space-x-3">
                          {(upcomingEvents[0].invitedMembers || []).slice(0, 4).map((member: any, i: number) => (
                            <img 
                              key={member.id || i} 
                              src={member.photo || member.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || "Membro")}&background=random`} 
                              className="w-10 h-10 rounded-full border-2 border-black object-cover" 
                              alt={member.name}
                            />
                          ))}
                          {(upcomingEvents[0].invitedMembers?.length > 4) && (
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-[10px] font-black text-white">
                              +{upcomingEvents[0].invitedMembers.length - 4}
                            </div>
                          )}
                          {(upcomingEvents[0].invitedMembers?.length === 0) && (
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white/40">
                              <Calendar className="w-4 h-4" />
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Past Events Grid */}
          <div className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gray-300 rounded-full" />
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-gray-400">O que já vivemos</h2>
              </div>
              <Link to="/eventos" className="text-xs font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">
                Ver Galeria Completa
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(pastEvents.length > 0 ? pastEvents : []).slice(0, 6).map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/evento/${event.id}`)}
                >
                  <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-6 shadow-lg border border-gray-100">
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg border border-black/5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-black text-black uppercase tracking-tighter">{event.neighborhood || "Local"}</span>
                    </div>

                    <button 
                      className={cn(
                        "absolute top-6 right-6 w-10 h-10 rounded-xl backdrop-blur-md border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300",
                        isFavorite(event.id) ? "bg-red-500 text-white border-red-500 opacity-100" : "bg-white/20 text-white border-white/20 hover:bg-primary hover:border-primary"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite({
                          id: event.id,
                          title: event.title,
                          thumbnail: event.image,
                          published: event.date,
                          link: `/evento/${event.id}`,
                          category: "event"
                        });
                      }}
                    >
                      <Heart className={cn("w-4 h-4", isFavorite(event.id) && "fill-current")} />
                    </button>
                    
                    <div className="absolute bottom-6 left-6 right-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <h4 className="text-xl font-black text-white leading-tight uppercase">{event.title}</h4>
                    </div>
                  </div>
                  
                  <div className="px-2">
                    <h4 className="text-lg font-black text-gray-900 group-hover:text-primary transition-colors uppercase truncate mb-1">{event.title}</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{event.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* More Upcoming list */}
          {upcomingEvents.length > 1 && (
            <div>
              <div className="flex items-center gap-3 mb-10">
                <div className="w-1 h-8 bg-black rounded-full" />
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic">Brevemente</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {upcomingEvents.slice(1, 5).map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/evento/${event.id}`)}
                  >
                    <div className="relative aspect-[3/4] rounded-[1.5rem] overflow-hidden mb-4 shadow-md border border-gray-100">
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <button 
                        className={cn(
                          "absolute top-4 right-4 w-8 h-8 rounded-lg backdrop-blur-md border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300",
                          isFavorite(event.id) ? "bg-red-500 text-white border-red-500 opacity-100" : "bg-white/20 text-white border-white/20 hover:bg-white/40"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite({
                            id: event.id,
                            title: event.title,
                            thumbnail: event.image,
                            published: event.date,
                            link: `/evento/${event.id}`,
                            category: "event"
                          });
                        }}
                      >
                        <Heart className={cn("w-3.5 h-3.5", isFavorite(event.id) && "fill-current")} />
                      </button>
                      <div className="absolute top-4 left-4 bg-primary px-3 py-1 rounded-lg text-white text-[10px] font-black uppercase tracking-widest">
                        FIXO
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="text-sm font-black text-white leading-tight uppercase line-clamp-2">{event.title}</h4>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

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
                  <div key={i} className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors group">
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
                src="https://picsum.photos/seed/church-interior/1000/1000" 
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
