import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Camera, Image as ImageIcon, Calendar, ArrowRight, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { cn, getImageUrl } from "@/lib/utils";

interface Album {
  id: string;
  title: string;
  date: string;
  cover: string;
  photos: string[];
}

export default function Gallery() {
  const location = useLocation();
  const stateAlbumId = location.state?.selectedAlbumId;

  const [albums, setAlbums] = useState<Album[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlbums = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "",
            date: data.date || "",
            cover: data.image || "",
            photos: data.gallery || []
          };
        })
        .filter(album => album.photos.length > 0);
      
      setAlbums(fetchedAlbums);
      setLoading(false);

      if (stateAlbumId) {
        const targetAlbum = fetchedAlbums.find(a => a.id === stateAlbumId);
        if (targetAlbum) {
          setSelectedAlbum(targetAlbum);
        }
      }
    });

    return () => unsubscribe();
  }, [stateAlbumId]);

  const filteredAlbums = albums.filter(album => 
    album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    album.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const WatermarkOverlay = ({ title, size = "normal" }: { title: string, size?: "normal" | "large" }) => (
    <div className={cn(
      "absolute pointer-events-none select-none opacity-20 text-white flex flex-col items-center justify-center z-10 w-full",
      size === "large" ? "inset-0" : "bottom-6 left-0 right-0"
    )}>
      <div className="flex flex-col items-center">
        <p className={cn(
          "font-black uppercase tracking-tighter text-white whitespace-nowrap",
          size === "large" ? "text-4xl md:text-6xl" : "text-sm md:text-base px-6 text-center"
        )}>
          {title}
        </p>
        <div className={cn(
          "flex items-center mt-1",
          size === "large" ? "text-xl md:text-3xl" : "text-[8px] md:text-[10px]"
        )}>
          <span className="text-white font-extralight tracking-tight">Ministério</span>
          <span className="text-white font-bold tracking-tight ml-1.5 uppercase">Profecia</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-24 pb-12 min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Removed Title and Description as requested */}

        {!selectedAlbum ? (
          <div className="space-y-8">
            {/* Search Filter */}
            <div className="max-w-xl mx-auto relative mb-16 px-4">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary w-5 h-5 z-10 transition-colors group-focus-within:text-white" />
                <input 
                  type="text"
                  placeholder="Pesquisar por nome do evento ou data (ex: Março 2026)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#121212] border-2 border-white/10 rounded-2xl h-16 pl-14 pr-14 text-white text-lg placeholder:text-gray-500 focus:outline-none focus:border-primary focus:bg-[#1a1a1a] transition-all shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] placeholder-shown:border-white/5"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="aspect-[4/3] bg-white/5 rounded-3xl" />
                ))}
              </div>
            ) : filteredAlbums.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredAlbums.map((album) => (
                  <motion.div
                    key={album.id}
                    whileHover={{ y: -10 }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedAlbum(album)}
                  >
                    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-black/5">
                      <WatermarkOverlay title={album.title} />
                      <img 
                        src={getImageUrl(album.cover)} 
                        alt={album.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex items-center gap-2 text-primary mb-2">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-widest">{album.date}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                          {album.title}
                        </h3>
                        <div className="mt-4 flex items-center gap-2 text-white/80 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                          Ver fotos <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Nenhum evento com fotos encontrado.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedAlbum(null)}
                className="text-muted-foreground hover:text-primary self-start"
              >
                ← Voltar para a galeria
              </Button>
              <div className="text-right">
                <h2 className="text-3xl font-bold uppercase tracking-tighter">{selectedAlbum.title}</h2>
                <p className="text-primary font-bold uppercase tracking-widest text-xs mt-1">{selectedAlbum.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {selectedAlbum.photos.map((photo, idx) => (
                <motion.div
                  key={`photo-${selectedAlbum.id}-${idx}`}
                  whileHover={{ scale: 1.02 }}
                  className="aspect-square rounded-2xl overflow-hidden cursor-pointer border border-white/5 shadow-lg group relative"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <WatermarkOverlay title={selectedAlbum.title} />
                  <img 
                    src={getImageUrl(photo)} 
                    alt={`Foto ${idx + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 md:p-12 cursor-pointer backdrop-blur-md"
            onClick={() => setSelectedPhoto(null)}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-full"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="w-8 h-8" />
            </Button>
            <div className="relative group max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <WatermarkOverlay title={selectedAlbum?.title || ""} size="large" />
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={getImageUrl(selectedPhoto)}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
