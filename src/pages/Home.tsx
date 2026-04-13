import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Calendar, 
  Youtube, 
  ArrowRight, 
  Star, 
  MessageSquare, 
  Heart, 
  Play, 
  X, 
  Share2, 
  Bookmark,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";

// Mock data for now
const BLOG_POSTS = [
  {
    id: "1",
    title: "Grande Cruzada de Evangelismo no Centro",
    excerpt: "Vejas as fotos e testemunhos do que Deus fez no último final de semana...",
    date: "10 Abr, 2026",
    image: "https://picsum.photos/seed/church1/800/600",
    category: "Evangelismo"
  },
  {
    id: "2",
    title: "Novo Ciclo de Discipulado Iniciado",
    excerpt: "Mais de 50 novos irmãos iniciaram sua caminhada com Cristo...",
    date: "08 Abr, 2026",
    image: "https://picsum.photos/seed/church2/800/600",
    category: "Ensino"
  },
  {
    id: "3",
    title: "Ação Social: Sopão Solidário",
    excerpt: "Nossa equipe de missões urbanas distribuiu mais de 200 refeições...",
    date: "05 Abr, 2026",
    image: "https://picsum.photos/seed/church3/800/600",
    category: "Missões"
  }
];

const REVIEWS = [
  { name: "João Silva", rating: 5, text: "Uma igreja acolhedora e que prega a verdade da palavra de Deus." },
  { name: "Maria Santos", rating: 5, text: "Lugar de paz e adoração genuína. Me sinto em casa aqui." },
  { name: "Pedro Oliveira", rating: 5, text: "O ministério de louvor é abençoado e a palavra é profunda." }
];

export default function Home() {
  const [isLive, setIsLive] = useState(false);
  const [nextService, setNextService] = useState("Domingo às 19:00");
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toggleFavorite, isFavorite } = useFavorites();

  const nextVideo = useCallback(() => {
    if (videos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % Math.min(videos.length, 6));
  }, [videos.length]);

  const prevVideo = useCallback(() => {
    if (videos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + Math.min(videos.length, 6)) % Math.min(videos.length, 6));
  }, [videos.length]);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) {
      prevVideo();
    } else if (info.offset.x < -100) {
      nextVideo();
    }
  };

  const handleShare = (video: any) => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        url: video.link
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(video.link);
      alert("Link copiado para a área de transferência!");
    }
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("/api/recent-videos");
        if (!response.ok) throw new Error("Failed to fetch videos");
        const data = await response.json();
        
        if (data && data.length > 0) {
          // Ensure uniqueness by ID
          const uniqueVideos = Array.from(new Map(data.map((v: any) => [v.id, v])).values());
          setVideos(uniqueVideos);
        } else {
          throw new Error("Empty videos array");
        }
      } catch (error) {
        console.error("Error fetching videos, using fallbacks:", error);
        // Fallback videos if API fails
        setVideos([
          {
            id: "fallback-1",
            title: "Culto de Celebração",
            thumbnail: "https://picsum.photos/seed/church1/800/600",
            published: new Date().toISOString(),
            link: "#"
          },
          {
            id: "fallback-2",
            title: "Estudo Bíblico",
            thumbnail: "https://picsum.photos/seed/church2/800/600",
            published: new Date().toISOString(),
            link: "#"
          },
          {
            id: "fallback-3",
            title: "Louvor e Adoração",
            thumbnail: "https://picsum.photos/seed/church3/800/600",
            published: new Date().toISOString(),
            link: "#"
          }
        ]);
      }
    };
    fetchVideos();

    // Check live status
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

  // Auto-play carousel every 5 seconds
  useEffect(() => {
    if (videos.length === 0) return;
    const timer = setInterval(() => {
      nextVideo();
    }, 5000);
    return () => clearInterval(timer);
  }, [nextVideo, videos.length]);

  // Listen for global "open live" event
  useEffect(() => {
    const handleOpenLive = () => {
      const heroElement = document.getElementById('hero');
      if (heroElement) {
        heroElement.scrollIntoView({ behavior: 'smooth' });
      }
      // If we have videos, try to find the first one (usually the latest/live)
      if (videos.length > 0) {
        setSelectedVideo(videos[0]);
      }
    };

    // Check if we landed with #hero hash
    if (window.location.hash === '#hero' && videos.length > 0) {
      handleOpenLive();
    }

    window.addEventListener('open-live-video', handleOpenLive);
    return () => window.removeEventListener('open-live-video', handleOpenLive);
  }, [videos]);

  return (
    <div className="flex flex-col bg-black">
      {/* Hero Section - Prime Video Style */}
      <section id="hero" className="relative min-h-screen flex flex-col bg-black text-white overflow-hidden">
        {/* Main Carousel Container */}
        <div className="relative flex-grow flex flex-col pt-28 md:pt-36">
          <div className="relative w-full overflow-hidden flex-grow flex items-center">
            <div className="relative w-full max-w-[1600px] mx-auto px-4 md:px-12">
              <div className="relative h-[400px] md:h-[600px] flex items-center justify-center">
                
                {/* Navigation Arrows */}
                {videos.length > 1 && (
                  <>
                    <div className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 z-[70] hidden md:block">
                      <button 
                        onClick={prevVideo}
                        className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white group"
                      >
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-active:scale-90 transition-transform" />
                      </button>
                    </div>
                    <div className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 z-[70] hidden md:block">
                      <button 
                        onClick={nextVideo}
                        className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white group"
                      >
                        <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-active:scale-90 transition-transform" />
                      </button>
                    </div>
                  </>
                )}

                <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {videos.slice(0, 6).map((video, index) => {
                      if (index !== currentIndex) return null;

                      return (
                        <motion.div
                          key={video.id}
                          initial={{ opacity: 0, x: 300 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -300 }}
                          transition={{ duration: 1.5, ease: "easeInOut" }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          {/* Side Previews (Visual only) - Adjusted for "side-by-side" feel */}
                          <div className="absolute left-[-60%] md:left-[-55%] w-[80%] h-[85%] opacity-10 scale-95 rounded-xl md:rounded-2xl overflow-hidden hidden lg:block border border-white/5">
                            <img 
                              src={videos[(currentIndex - 1 + videos.length) % videos.length]?.thumbnail} 
                              alt="" 
                              className="w-full h-full object-cover blur-[2px]"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src.includes('maxresdefault.jpg')) {
                                  target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                                }
                              }}
                            />
                          </div>
                          <div className="absolute right-[-60%] md:right-[-55%] w-[80%] h-[85%] opacity-10 scale-95 rounded-xl md:rounded-2xl overflow-hidden hidden lg:block border border-white/5">
                            <img 
                              src={videos[(currentIndex + 1) % videos.length]?.thumbnail} 
                              alt="" 
                              className="w-full h-full object-cover blur-[2px]"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src.includes('maxresdefault.jpg')) {
                                  target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                                }
                              }}
                            />
                          </div>

                          {/* Main Card - Reduced rounding */}
                          <div 
                            className="relative w-full lg:w-[90%] h-full rounded-xl md:rounded-2xl overflow-hidden shadow-2xl group cursor-pointer border border-white/10"
                            onClick={() => setSelectedVideo(video)}
                          >
                            <img 
                              src={video.thumbnail} 
                              alt="" 
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src.includes('maxresdefault.jpg')) {
                                  target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                                }
                              }}
                            />
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                            
                            {/* Content Overlay */}
                            <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end items-start text-left">
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="max-w-2xl"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <span className={cn(
                                    "text-white px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
                                    isLive && index === 0 ? "bg-red-600 animate-pulse" : "bg-[#BF76FF]"
                                  )}>
                                    {isLive && index === 0 ? "AO VIVO AGORA" : "Destaque"}
                                  </span>
                                  <span className="text-white/60 text-[10px] font-medium uppercase tracking-widest">
                                    {new Date(video.published).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                
                                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight">
                                  {video.title}
                                </h2>

                                <div className="flex flex-wrap items-center gap-3">
                                  <Button 
                                    className="bg-white text-black hover:bg-white/90 rounded-full px-6 h-10 text-xs font-bold transition-all active:scale-95 flex items-center gap-2"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    Assistir
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    className="bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-full px-6 h-10 text-xs font-bold backdrop-blur-md"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(video);
                                    }}
                                  >
                                    <Heart className={cn("w-3.5 h-3.5 mr-2", isFavorite(video.id) && "fill-current text-red-500")} />
                                    {isFavorite(video.id) ? "Salvo" : "Salvar"}
                                  </Button>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lives Recentes Section */}
        <div className="relative z-20 pb-20 px-4 md:px-12">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-[#BF76FF] rounded-full" />
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Lives Recentes</h2>
              </div>
              <Link to="/galeria" className="text-sm font-bold text-white/40 hover:text-white transition-colors flex items-center gap-2 group">
                Ver Tudo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {videos.slice(0, 5).map((video, idx) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className="group cursor-pointer"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="aspect-video rounded-lg md:rounded-xl overflow-hidden border border-white/5 relative mb-3">
                    <img 
                      src={video.thumbnail} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('maxresdefault.jpg')) {
                          target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                        <Play className="w-5 h-5 fill-current ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
                        Gravado
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold line-clamp-2 group-hover:text-[#BF76FF] transition-colors leading-snug">
                    {video.title}
                  </h3>
                  <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">
                    {new Date(video.published).toLocaleDateString('pt-BR')}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl bg-[#111] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/10 transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="aspect-video w-full">
                <iframe 
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">{selectedVideo.title}</h2>
                    <p className="text-white/60">
                      Publicado em {new Date(selectedVideo.published).toLocaleDateString('pt-BR')} às {new Date(selectedVideo.published).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      className={cn(
                        "rounded-full border-white/10 hover:bg-white/5",
                        isFavorite(selectedVideo.id) && "text-red-500 border-red-500/30 bg-red-500/5"
                      )}
                      onClick={() => toggleFavorite(selectedVideo)}
                    >
                      <Heart className={cn("w-4 h-4 mr-2", isFavorite(selectedVideo.id) && "fill-current")} />
                      {isFavorite(selectedVideo.id) ? "Favoritado" : "Favoritar"}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="rounded-full border-white/10 hover:bg-white/5"
                      onClick={() => handleShare(selectedVideo)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="rounded-full border-white/10 hover:bg-white/5"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blog / Acontecimentos */}
      <section className="py-24 px-4 bg-white rounded-t-[3rem] -mt-10 relative z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-bold mb-4">Acontecimentos</h2>
              <p className="text-muted-foreground max-w-xl">
                Fique por dentro de tudo o que tem acontecido em nossa igreja e no campo de evangelismo.
              </p>
            </div>
            <Button variant="ghost" className="text-primary hover:text-primary/80 group">
              Ver todos os posts <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white border-black/5 overflow-hidden group cursor-pointer hover:border-primary/30 transition-all shadow-sm">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded">
                        {post.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{post.date}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {post.excerpt}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Google Reviews */}
      <section className="py-24 px-4 bg-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">O que dizem sobre nós</h2>
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              ))}
            </div>
            <span className="font-bold text-lg">4.9/5 no Google</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {REVIEWS.map((review, idx) => (
              <Card key={idx} className="glass-panel border-black/5 p-8 text-left relative overflow-hidden">
                <div className="absolute -top-4 -right-4 opacity-5">
                  <MessageSquare className="w-24 h-24" />
                </div>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-lg italic mb-6 relative z-10">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {review.name[0]}
                  </div>
                  <span className="font-bold">{review.name}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Heart className="w-16 h-16 text-primary mx-auto mb-8 animate-pulse" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Venha nos fazer uma visita</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Estamos de braços abertos para receber você e sua família. 
            Experimente o amor de Deus em comunidade.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/80 text-white px-12 h-16 rounded-full text-xl">
            Ver Localização no Maps
          </Button>
        </div>
      </section>
    </div>
  );
}
