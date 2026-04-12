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
  }, []);

  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        // Now calling our own internal API which handles the scraping on the server
        const response = await fetch("/api/live-status");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setIsLive(data.isLive);
      } catch (error) {
        setIsLive(false);
      }
    };

    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col bg-black">
      {/* Hero Section - New Design from Image */}
      <section className="relative min-h-screen flex flex-col items-center justify-start pt-32 pb-20 overflow-hidden bg-black text-white">
        {/* Background Pattern (Subtle grid/circles like in image) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0" style={{ 
            backgroundImage: `radial-gradient(circle at 2px 2px, #666 1px, transparent 0)`,
            backgroundSize: '40px 40px' 
          }} />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mb-16">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.3
                }
              }
            }}
          >
            <h1 className="text-4xl md:text-7xl lg:text-8xl mb-8 tracking-tighter leading-none flex flex-wrap items-center justify-center gap-x-[0.3em] gap-y-4">
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: 30, filter: "blur(15px)" },
                  visible: { opacity: 1, y: 0, filter: "blur(0px)" }
                }}
                transition={{ duration: 1, ease: [0.2, 0.65, 0.3, 0.9] }}
                className="font-light text-white/80 whitespace-nowrap"
              >
                Tudo posso
              </motion.span>
              <motion.span
                variants={{
                  hidden: { opacity: 0, scale: 0.9, filter: "blur(20px)" },
                  visible: { opacity: 1, scale: 1, filter: "blur(0px)" }
                }}
                transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                className="font-bold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] whitespace-nowrap"
              >
                naquele que me fortalece
              </motion.span>
            </h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                textShadow: [
                  "0 0 10px rgba(191,118,255,0.4)",
                  "0 0 30px rgba(191,118,255,0.8)",
                  "0 0 10px rgba(191,118,255,0.4)"
                ]
              }}
              transition={{ 
                opacity: { duration: 1, delay: 1.5 },
                textShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
              }}
              className="text-2xl md:text-3xl text-[#BF76FF] mb-12 font-bold tracking-[0.3em] uppercase"
            >
              Filipenses 4:13
            </motion.p>
            
            <div className="flex justify-center mb-12">
              <Link 
                to="/ao-vivo" 
                className={cn(
                  "px-10 h-12 rounded-full text-sm font-bold tracking-widest transition-all active:scale-95 flex items-center justify-center",
                  isLive 
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/20" 
                    : "bg-white hover:bg-gray-100 text-black shadow-xl shadow-white/10"
                )}
              >
                {isLive ? (
                  <>
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    AO VIVO
                  </>
                ) : (
                  "OFFLINE"
                )}
              </Link>
            </div>

            <p className="text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-12">
              Conteúdos recentes e Lives AO VIVO
            </p>
          </motion.div>
        </div>

        {/* Curved Cards Section (Cover Flow Effect) */}
        <div className="relative w-full max-w-[1400px] mx-auto px-4 -mt-16 overflow-visible">
          <div className="relative h-[300px] md:h-[500px] flex items-center justify-center perspective-[2000px]">
            
            {/* Navigation Arrows */}
            {videos.length > 1 && (
              <>
                <button 
                  onClick={prevVideo}
                  className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hidden md:flex items-center justify-center hover:bg-white/20 transition-all text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={nextVideo}
                  className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hidden md:flex items-center justify-center hover:bg-white/20 transition-all text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="relative w-full h-full flex items-center justify-center">
              {videos.slice(0, 6).map((video, index) => {
                const total = Math.min(videos.length, 6);
                const diff = (index - currentIndex + total) % total;
                
                let position = "hidden";
                if (diff === 0) position = "center";
                else if (diff === 1) position = "right";
                else if (diff === total - 1) position = "left";

                const variants = {
                  center: { 
                    x: 0, 
                    scale: 1, 
                    zIndex: 40, 
                    opacity: 1, 
                    rotateY: 0,
                    filter: "blur(0px)",
                    display: "block"
                  },
                  right: { 
                    x: "35%", 
                    scale: 0.8, 
                    zIndex: 30, 
                    opacity: 0.4, 
                    rotateY: -35,
                    filter: "blur(2px)",
                    display: "block"
                  },
                  left: { 
                    x: "-35%", 
                    scale: 0.8, 
                    zIndex: 30, 
                    opacity: 0.4, 
                    rotateY: 35,
                    filter: "blur(2px)",
                    display: "block"
                  },
                  hidden: { 
                    x: 0, 
                    scale: 0.5, 
                    zIndex: 10, 
                    opacity: 0, 
                    rotateY: 0,
                    filter: "blur(10px)",
                    display: "none"
                  }
                };

                return (
                  <motion.div
                    key={video.id}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    initial={false}
                    animate={position}
                    variants={variants}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 30,
                      opacity: { duration: 0.4 }
                    }}
                    className="absolute w-[90%] md:w-[700px] aspect-video rounded-[2.5rem] overflow-hidden border border-white/20 shadow-2xl cursor-pointer group"
                    style={{ transformStyle: "preserve-3d" }}
                    onClick={() => position === "center" && setSelectedVideo(video)}
                  >
                    <img src={video.thumbnail} alt="" className="w-full h-full object-cover pointer-events-none" />
                    
                    {/* Hover Info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-8 md:p-10 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-[#BF76FF]/40 backdrop-blur-md px-3 py-1 rounded text-xs uppercase tracking-wider font-bold border border-[#BF76FF]/30">
                          {video.title.toLowerCase().includes('live') ? 'Live' : 'Vídeo'}
                        </span>
                        <span className="text-xs text-gray-300">
                          {new Date(video.published).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold line-clamp-2 leading-tight">{video.title}</h3>
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-20 h-20 rounded-full bg-[#BF76FF]/80 backdrop-blur-sm flex items-center justify-center text-white shadow-lg shadow-[#BF76FF]/30 group-hover:scale-110 group-hover:bg-[#BF76FF] transition-all">
                        <Play className="w-10 h-10 fill-white ml-1" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
      <section className="py-24 px-4 bg-muted/20">
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
