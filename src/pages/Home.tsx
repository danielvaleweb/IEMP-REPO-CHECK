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
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/contexts/FavoritesContext";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, doc } from "firebase/firestore";

export default function Home() {
  const [isLive, setIsLive] = useState(false);
  const [nextService, setNextService] = useState("Domingo às 19:00");
  const [videos, setVideos] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [settings, setSettings] = useState<any>({ enableHeaderVideos: true });
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "settings"));
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
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => {
        const data = doc.data();
        let displayDate = data.date || "";
        let displayTime = "";
        
        // Handle the new format: DD/MM/YYYY - HH:mm - HH:mm
        if (displayDate.includes(' - ')) {
          const parts = displayDate.split(' - ');
          displayDate = parts[0];
          displayTime = parts[1]; // Start time
        }

        return {
          id: doc.id,
          title: data.title,
          description: data.content,
          date: displayDate,
          time: displayTime,
          category: data.organization || "Evento",
          image: data.image || `https://picsum.photos/seed/${doc.id}/600/400`
        };
      });
      setRecentEvents(eventsData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("/api/recent-videos");
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
            id: "dQw4w9WgXcQ",
            title: "Culto de Celebração - 14/04",
            thumbnail: "https://picsum.photos/seed/church1/1920/1080",
            published: new Date().toISOString(),
            link: "https://youtube.com/watch?v=dQw4w9WgXcQ"
          },
          {
            id: "9bZkp7q19f0",
            title: "Estudo Bíblico: Romanos 8",
            thumbnail: "https://picsum.photos/seed/church2/1920/1080",
            published: new Date().toISOString(),
            link: "https://youtube.com/watch?v=9bZkp7q19f0"
          }
        ]);
      }
    };

    fetchVideos();
    
    // Check if live
    const checkLive = async () => {
      try {
        const response = await fetch("/api/live-status");
        if (!response.ok) throw new Error("Failed to fetch live status");
        const data = await response.json();
        setIsLive(data.isLive);
      } catch (error) {
        console.error("Error checking live status:", error);
      }
    };
    checkLive();
    const interval = setInterval(checkLive, 60000);
    return () => clearInterval(interval);
  }, []);

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
                      onClick={() => {
                        setSelectedVideo(videos[currentIndex]);
                        setIsWatching(true);
                      }}
                    >
                      <Play className="w-6 h-6 fill-current" />
                      Assistir
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-black/40 backdrop-blur-md border-white/20 text-white hover:bg-white/20 rounded-md px-8 h-12 text-lg font-bold"
                      onClick={() => toggleFavorite(videos[currentIndex])}
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

      {/* Lives Recentes Section */}
      <div className="relative z-20 pb-20 px-4 md:px-12 bg-black">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-[#BF76FF] rounded-full" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Lives Recentes</h2>
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
                onClick={() => {
                  setSelectedVideo(video);
                  setIsWatching(true);
                }}
              >
                <div className="relative aspect-video rounded-lg overflow-hidden mb-3 border border-white/5">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-primary transition-colors">
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

      {/* Eventos Recentes Section */}
      <section className="py-24 px-4 md:px-12 bg-white rounded-t-[3rem] text-black relative z-30 -mt-10">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-primary rounded-full" />
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">Eventos Recentes</h2>
            </div>
            <Link to="/blog" className="text-sm font-bold text-black/60 hover:text-black transition-colors flex items-center gap-2 group">
              Ver Todos <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentEvents.length > 0 ? (
              recentEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group cursor-pointer bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-bold text-black">{event.category}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary/70" />
                        {event.date}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary/70" />
                        {event.time}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-400">
                Nenhum evento recente encontrado.
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
