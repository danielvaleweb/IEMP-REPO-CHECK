import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  Share2, 
  Play, 
  X,
  Maximize2,
  Tag,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No such document!");
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#BF76FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="absolute top-8 left-6 md:left-12 z-20">
          <Button 
            variant="ghost" 
            className="bg-black/40 backdrop-blur-md text-white hover:bg-white/20 rounded-full h-12 px-6 flex items-center gap-2"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </Button>
        </div>

        <div className="absolute bottom-12 left-6 md:left-12 right-6 md:right-12 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#BF76FF] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {event.organization || "Evento"}
              </span>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Calendar className="w-4 h-4" />
                {event.date?.split(' - ')[0]}
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter uppercase leading-none">
              {event.title}
            </h1>
            <div className="flex flex-wrap gap-6 text-sm md:text-base text-white/80">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#BF76FF]" />
                {event.date?.split(' - ').slice(1).join(' - ')}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#BF76FF]" />
                {event.location}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="px-6 md:px-12 py-12 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Info className="w-5 h-5 text-[#BF76FF]" />
                <h2 className="text-xl font-bold uppercase tracking-wider">Sobre o Evento</h2>
              </div>
              <p className="text-white/70 text-lg leading-relaxed whitespace-pre-wrap">
                {event.content}
              </p>
            </div>

            {/* Gallery */}
            {event.gallery && event.gallery.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Tag className="w-5 h-5 text-[#BF76FF]" />
                  <h2 className="text-xl font-bold uppercase tracking-wider">Galeria de Fotos</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {event.gallery.map((img: string, idx: number) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group"
                      onClick={() => setSelectedImage(img)}
                    >
                      <img 
                        src={img} 
                        alt="" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {event.videos && event.videos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Play className="w-5 h-5 text-[#BF76FF]" />
                  <h2 className="text-xl font-bold uppercase tracking-wider">Vídeos</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {event.videos.map((video: string, idx: number) => {
                    const videoId = getYoutubeId(video);
                    if (!videoId) return null;
                    return (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group"
                        onClick={() => setSelectedVideo(videoId)}
                      >
                        <img 
                          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                          alt="" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-[#BF76FF] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-white fill-current" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sticky top-24">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#BF76FF]" />
                Compartilhar
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl h-12"
                  onClick={() => {
                    navigator.share?.({
                      title: event.title,
                      text: event.content,
                      url: window.location.href
                    }).catch(() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copiado!");
                    });
                  }}
                >
                  Link
                </Button>
                <Button 
                  className="bg-[#25D366] hover:bg-[#25D366]/90 text-white rounded-xl h-12 font-bold"
                  onClick={() => {
                    window.open(`https://wa.me/?text=${encodeURIComponent(`${event.title}\n\n${window.location.href}`)}`, '_blank');
                  }}
                >
                  WhatsApp
                </Button>
              </div>

              {event.observations && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Observações</h4>
                  <p className="text-sm text-white/60 italic leading-relaxed">
                    "{event.observations}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
            onClick={() => setSelectedImage(null)}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-8 right-8 text-white hover:bg-white/10 rounded-full"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </Button>
            <img 
              src={selectedImage} 
              alt="" 
              className="max-w-full max-h-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}

        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-8 right-8 text-white hover:bg-white/10 rounded-full z-[110]"
              onClick={() => setSelectedVideo(null)}
            >
              <X className="w-8 h-8" />
            </Button>
            <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1`}
                className="w-full h-full border-none"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
