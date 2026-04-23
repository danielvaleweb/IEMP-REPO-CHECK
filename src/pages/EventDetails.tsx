import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Calendar, Clock, MapPin, Tag, Navigation, Play, Image as ImageIcon, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);

    const fetchEvent = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEvent({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full font-bold animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-black">
        <h2 className="text-2xl font-bold mb-4">Evento não encontrado</h2>
        <Button onClick={() => navigate("/")} variant="outline" className="border-black text-black">Voltar para o Início</Button>
      </div>
    );
  }

  // Parse dates
  let displayDate = event.date || "";
  let startTime = "";
  let endTime = event.endTime || "";

  if (displayDate.includes('T')) {
    const parts = displayDate.split('T');
    displayDate = parts[0].split('-').reverse().join('/');
    startTime = parts[1].substring(0, 5);
  } else if (displayDate.includes(' - ')) {
    const parts = displayDate.split(' - ');
    displayDate = parts[0];
    startTime = parts[1];
    if (parts.length > 2) endTime = parts[2];
  }

  const navigateToMaps = () => {
    if (!event.location) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
    window.open(url, '_blank');
  };

  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = getYoutubeVideoId(event.youtubeLink);

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-24 selection:bg-primary/20 selection:text-primary">
      {/* Hero Header */}
      <div className="relative h-[60vh] md:h-[75vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img 
          src={event.image || `https://picsum.photos/seed/${event.id}/1920/1080`} 
          alt={event.title}
          className="w-full h-full object-cover scale-105 animate-in zoom-in duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent z-10" />
        
        {/* Navigation */}
        <div className="absolute top-0 left-0 w-full p-6 z-30 flex justify-between items-center">
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost" 
            className="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:text-white rounded-2xl h-12 px-6 shadow-lg transition-all font-bold group border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Voltar
          </Button>

          {event.organization && (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 text-white px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center shadow-lg">
              <Tag className="w-4 h-4 mr-2" />
              {event.organization}
            </div>
          )}
        </div>
        
        {/* Hero Title Overlay */}
        <div className="absolute bottom-32 md:bottom-40 left-0 w-full px-6 z-20">
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
              <span className="bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl backdrop-blur-md border border-white/10 inline-block mb-6">
                Evento Oficial
              </span>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-white drop-shadow-2xl hero-title filter">
                {event.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-30 -mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-16">
          {/* Main Content */}
          <div className="space-y-12">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-1 bg-black rounded-full" />
                <h3 className="text-2xl font-black uppercase tracking-tighter">Sobre o Evento</h3>
              </div>
              <div className="max-w-none">
                <p className="text-gray-600 leading-[1.8] text-lg lg:text-xl font-medium whitespace-pre-wrap">
                  {event.content}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4 pt-4">
            {/* Bento Box 1: Date */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 group transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Quando</h3>
                <p className="text-base font-black text-gray-900 leading-none">{displayDate}</p>
              </div>
            </div>

            {/* Bento Box 2: Time */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 group transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-500/5 flex items-center justify-center shrink-0 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Horário</h3>
                <div className="flex items-center gap-2 leading-none">
                  <p className="text-base font-black text-gray-900">{startTime || "--:--"}</p>
                  {endTime && (
                    <>
                      <div className="w-2 h-0.5 bg-gray-200 rounded-full" />
                      <p className="text-xs font-bold text-gray-400">{endTime}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bento Box 3: Location */}
            <div className="bg-gray-900 rounded-2xl shadow-md p-4 flex flex-col overflow-hidden relative group transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-[#BF76FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-start gap-4 relative z-10 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-white">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1.5">Localização</h3>
                  <p className="text-white text-sm font-bold leading-snug">{event.location || "A definir"}</p>
                </div>
              </div>

              {event.location && (
                <Button 
                  onClick={navigateToMaps}
                  className="w-full bg-white text-black hover:bg-gradient-to-r hover:from-primary hover:to-secondary hover:text-white hover:scale-[1.05] hover:shadow-[0_10px_25px_-5px_rgba(191,118,255,0.4)] rounded-xl h-12 relative z-10 font-black uppercase tracking-widest text-xs flex items-center justify-center transition-all duration-300 border border-gray-100/50"
                >
                  Me leve até lá
                </Button>
              )}
            </div>

            {/* Optional Youtube Embed */}
            {youtubeId && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-1 bg-red-500 rounded-full" />
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Vídeo</h3>
                </div>
                <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-gray-100 group relative">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                    className="w-full h-full relative z-10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Optional Photo Gallery */}
        {event.gallery && Array.isArray(event.gallery) && event.gallery.length > 0 && (
          <div className="mt-20 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
            <div className="flex flex-col items-center justify-center text-center mb-12">
              <div className="w-16 h-1 bg-[#BF76FF] rounded-full mb-6" />
              <h3 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter flex items-center gap-3">
                Momentos Inesquecíveis
              </h3>
              <p className="text-gray-500 mt-4 max-w-lg mb-4">Confira tudo o que rolou neste evento através das lentes da nossa equipe de mídia.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[150px] md:auto-rows-[200px] gap-3 md:gap-4 lg:gap-6 relative group/gallery">
              
              {/* Blur Overlay for Guests */}
              {!user && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-x-0 inset-y-0 z-30 flex flex-col items-center justify-center p-6 text-center"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring", damping: 20 }}
                    className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center gap-6 max-w-sm"
                  >
                    <div className="w-20 h-20 rounded-[2rem] bg-orange-500/10 flex items-center justify-center text-orange-500 mb-2">
                      <Lock className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-black uppercase tracking-tighter text-gray-900">Galeria Restrita</p>
                      <p className="text-sm font-medium text-gray-600 leading-relaxed">Acesse sua conta para ver e baixar todas as fotos em alta resolução deste evento.</p>
                    </div>
                    <Button 
                      onClick={() => navigate("/admin")} 
                      className="bg-black hover:bg-gray-900 text-white shadow-2xl h-14 px-10 rounded-2xl w-full uppercase tracking-widest text-xs font-black transition-all hover:scale-[1.02] active:scale-95"
                    >
                      Fazer Login
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {event.gallery.map((url: string, index: number) => {
                // Layout classes based on sequence to create a nice masonry bento look
                let spanClasses = "col-span-1 row-span-1";
                if (index % 7 === 0) spanClasses = "col-span-2 row-span-2"; // Big Feature
                else if (index % 7 === 3) spanClasses = "col-span-2 row-span-1"; // Wide
                else if (index % 7 === 5) spanClasses = "col-span-1 row-span-2"; // Tall
                
                return (
                  <div 
                    key={index} 
                    className={cn(
                      "rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-gray-100 group relative transition-all duration-500",
                      spanClasses,
                      !user && "filter blur-md md:blur-lg opacity-70 cursor-not-allowed scale-[0.98]",
                      user && "shadow-sm hover:shadow-[0_20px_50px_rgb(0,0,0,0.12)] cursor-pointer hover:z-10 hover:scale-[1.02]"
                    )}
                  >
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                    <img 
                      src={url} 
                      alt={`Galeria ${index + 1}`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    
                    {user && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <Button 
                          className="pointer-events-auto bg-white hover:bg-gray-100 text-black rounded-full w-14 h-14 p-0 shadow-2xl flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100"
                          onClick={() => {
                            // Dummy direct download trigger (for real usage this requires a Blob approach)
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `evento-foto-${index + 1}.jpg`;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
