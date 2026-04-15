import { useState, useEffect } from "react";
import { Camera, Image as ImageIcon, Calendar, ArrowRight, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Gallery() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#BF76FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase">Nossa Galeria</h1>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            Momentos especiais registrados em nossa caminhada. Explore as fotos e vídeos de nossos eventos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <motion.div
              key={event.id}
              whileHover={{ y: -10 }}
              className="group cursor-pointer"
              onClick={() => navigate(`/evento/${event.id}`)}
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-white/5 bg-[#111]">
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                <div className="absolute top-4 right-4 flex gap-2">
                  {event.gallery && event.gallery.length > 0 && (
                    <div className="bg-black/60 backdrop-blur-md p-2 rounded-full text-white">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                  {event.videos && event.videos.length > 0 && (
                    <div className="bg-[#BF76FF]/80 backdrop-blur-md p-2 rounded-full text-white">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  )}
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-2 text-[#BF76FF] mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">{event.date?.split(' - ')[0]}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-[#BF76FF] transition-colors line-clamp-1">
                    {event.title}
                  </h3>
                  <div className="mt-4 flex items-center gap-2 text-white/80 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                    Ver detalhes <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-20 text-white/40">
            Nenhum evento encontrado na galeria.
          </div>
        )}
      </div>
    </div>
  );
}

