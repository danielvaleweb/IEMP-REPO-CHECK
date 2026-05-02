import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Camera, 
  Image as ImageIcon, 
  Calendar, 
  ArrowRight, 
  X, 
  Search, 
  Download, 
  Heart, 
  Info, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Clock
} from "lucide-react";
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

// Custom hook for responsive detection
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
};

export default function Gallery() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateAlbumId = location.state?.selectedAlbumId;
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [albums, setAlbums] = useState<Album[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Watermark Settings (State could be moved to global if needed)
  const [watermarkConfig] = useState({
    type: "automatic", // automatic, disabled, image
    text: "Ministério Profecia",
    opacity: 0.2
  });

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

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("gallery_favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = (photoUrl: string) => {
    const newFavs = favorites.includes(photoUrl) 
      ? favorites.filter(f => f !== photoUrl) 
      : [...favorites, photoUrl];
    setFavorites(newFavs);
    localStorage.setItem("gallery_favorites", JSON.stringify(newFavs));
  };

  const downloadWithWatermark = async (photoUrl: string, albumTitle: string) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = getImageUrl(photoUrl);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      if (watermarkConfig.type !== "disabled") {
        const fontSize = Math.max(img.width * 0.03, 20);
        ctx.globalAlpha = watermarkConfig.opacity;
        ctx.fillStyle = "white";
        ctx.font = `black ${fontSize}px "Inter", sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";

        const margin = fontSize;
        const text = albumTitle.toUpperCase();
        
        // Draw Shadow for readability
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        
        // Draw Text
        ctx.fillText(text, canvas.width - margin, canvas.height - margin);
        
        // Small Subtitle
        ctx.font = `300 ${fontSize * 0.5}px "Inter", sans-serif`;
        ctx.fillText("MINISTÉRIO PROFECIA", canvas.width - margin, canvas.height - margin + (fontSize * 0.6));
      }

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `profecia-${albumTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Erro ao baixar imagem:", error);
      // Fallback simple download
      window.open(getImageUrl(photoUrl), "_blank");
    }
  };

  const filteredAlbums = albums.filter(album => 
    album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    album.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const WatermarkOverlay = ({ title, size = "normal" }: { title: string, size?: "normal" | "large" }) => {
    if (watermarkConfig.type === "disabled") return null;
    
    return (
      <div className={cn(
        "absolute pointer-events-none select-none text-white z-10 w-full flex flex-col items-end",
        size === "large" ? "bottom-12 right-12" : "bottom-8 right-8"
      )} style={{ opacity: watermarkConfig.opacity }}>
        <p className={cn(
          "font-black uppercase tracking-tighter text-white whitespace-nowrap text-right leading-none",
          size === "large" ? "text-3xl md:text-5xl" : "text-[10px] md:text-sm"
        )}>
          {title}
        </p>
        <div className={cn(
          "flex items-center mt-1",
          size === "large" ? "text-lg md:text-xl" : "text-[6px] md:text-[8px]"
        )}>
          <span className="text-white/40 font-light tracking-widest uppercase">Ministério</span>
          <span className="text-white font-black tracking-widest ml-1 uppercase">Profecia</span>
        </div>
      </div>
    );
  };

  const paginatedPhotos = selectedAlbum 
    ? selectedAlbum.photos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];

  const totalPages = selectedAlbum ? Math.ceil(selectedAlbum.photos.length / itemsPerPage) : 0;

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
                    onClick={() => {
                      setSelectedAlbum(album);
                      setCurrentPage(1);
                    }}
                  >
                    <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                      <WatermarkOverlay title={album.title} />
                      <img 
                        src={getImageUrl(album.cover)} 
                        alt={album.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      {/* Deep black gradient for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="absolute bottom-4 left-6 right-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="flex items-center gap-2 text-primary mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{album.date}</span>
                        </div>
                        <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors leading-tight uppercase tracking-tighter">
                          {album.title}
                        </h3>
                        <div className="mt-4 flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                          Explorar Álbum <ArrowRight className="w-3 h-3" />
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedAlbum(null)}
                className="text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl flex items-center gap-2 px-6 h-12 self-start font-bold uppercase tracking-widest text-[10px]"
              >
                <ArrowRight className="w-4 h-4 rotate-180" /> Galeria de Álbuns
              </Button>
              <div className="text-right">
                <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">{selectedAlbum.title}</h2>
                <div className="flex items-center justify-end gap-3 mt-2">
                  <span className="w-8 h-[1px] bg-primary" />
                  <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">{selectedAlbum.date}</p>
                </div>
              </div>
            </div>

            {isMobile ? (
              /* Mobile Carousel Mode */
              <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 gap-4 pb-8">
                {selectedAlbum.photos.map((photo, idx) => (
                  <div 
                    key={`mobile-photo-${idx}`}
                    className="min-w-[85vw] aspect-[3/4] rounded-[2.5rem] overflow-hidden snap-center relative shadow-2xl bg-white/5 border border-white/10"
                  >
                    <WatermarkOverlay title={selectedAlbum.title} />
                    <img src={getImageUrl(photo)} alt="" className="w-full h-full object-cover" />
                    
                    {/* Corner Actions for Mobile */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-3">
                      <Button 
                        size="icon" 
                        onClick={() => downloadWithWatermark(photo, selectedAlbum.title)}
                        className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-xl"
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                      <Button 
                        size="icon" 
                        onClick={() => setShowInfoModal(true)}
                        className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl"
                      >
                        <Info className="w-5 h-5" />
                      </Button>
                    </div>
                    
                    <div className="absolute top-6 right-6">
                       <Button 
                        size="icon" 
                        onClick={() => toggleFavorite(photo)}
                        className={cn(
                          "w-12 h-12 rounded-2xl backdrop-blur-md border border-white/20 transition-all",
                          favorites.includes(photo) ? "bg-red-500 text-white border-red-500" : "bg-white/5 text-white"
                        )}
                      >
                        <Heart className={cn("w-5 h-5", favorites.includes(photo) && "fill-current")} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Grid Mode with Pagination */
              <div className="space-y-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {paginatedPhotos.map((photo, idx) => {
                    const actualIdx = (currentPage - 1) * itemsPerPage + idx;
                    return (
                      <motion.div
                        key={`photo-${selectedAlbum.id}-${actualIdx}`}
                        layoutId={`photo-${selectedAlbum.id}-${actualIdx}`}
                        whileHover={{ y: -5 }}
                        className="aspect-square rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 shadow-xl group relative bg-white/5"
                        onClick={() => setSelectedPhotoIndex(actualIdx)}
                      >
                        <WatermarkOverlay title={selectedAlbum.title} />
                        <img 
                          src={getImageUrl(photo)} 
                          alt={`Foto ${actualIdx + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="icon" className="w-14 h-14 rounded-full bg-primary text-black transform scale-0 group-hover:scale-100 transition-transform duration-300">
                            <ImageIcon className="w-6 h-6" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-6 pt-8">
                    <Button
                      variant="ghost"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="text-white hover:bg-white/5 rounded-2xl h-12 px-6 flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </Button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={`page-${i}`}
                          onClick={() => setCurrentPage(i + 1)}
                          className={cn(
                            "w-10 h-10 rounded-xl transition-all font-black text-xs",
                            currentPage === i + 1 ? "bg-primary text-black shadow-lg shadow-primary/20" : "text-gray-500 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="text-white hover:bg-white/5 rounded-2xl h-12 px-6 flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]"
                    >
                      Próxima <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Modal / Privacy Policy */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setShowInfoModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#121212] border border-white/10 rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Termos de Uso e Imagem</h3>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Direitos Autorais e Privacidade</p>
                </div>
              </div>

              <div className="space-y-6 text-gray-300">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 shadow-inner">
                  <p className="text-sm leading-relaxed mb-4">
                    Todas as fotografias exibidas nesta galeria são de propriedade exclusiva do <span className="text-white font-bold tracking-tight">Ministério Profecia</span>. O download é permitido apenas para uso pessoal em redes sociais, devendo ser mantida a marca d'água oficial.
                  </p>
                  <p className="text-sm leading-relaxed">
                    Ao utilizar este serviço, você reconhece que a igreja possui autorização implícita (conforme regras internas de eventos públicos) para o registro fotográfico dos cultos e eventos.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <Button 
                    className="w-full bg-red-500 hover:bg-red-600 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 group"
                    onClick={() => {
                      alert("Sua solicitação será enviada para nossa equipe técnica analisar a remoção da imagem. Por favor, anote o ID do álbum.");
                      setShowInfoModal(false);
                    }}
                  >
                    <AlertCircle className="w-5 h-5 group-hover:animate-pulse" /> Pedir para remover minha imagem
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => setShowInfoModal(false)}
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-500 hover:text-white"
                  >
                    Entendi e concordo
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Lightbox */}
      <AnimatePresence>
        {selectedPhotoIndex !== null && !isMobile && selectedAlbum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/98 flex flex-col cursor-default select-none"
          >
            {/* Top Toolbar */}
            <div className="h-24 px-12 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent relative z-20">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{selectedAlbum.date}</span>
                <h4 className="text-2xl font-black uppercase tracking-tighter">{selectedAlbum.title}</h4>
              </div>

              <div className="flex items-center gap-3">
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => toggleFavorite(selectedAlbum.photos[selectedPhotoIndex])}
                  className={cn(
                    "w-14 h-14 rounded-2xl backdrop-blur-md border border-white/10 transition-all",
                    favorites.includes(selectedAlbum.photos[selectedPhotoIndex]) ? "bg-red-500 text-white" : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Heart className={cn("w-6 h-6", favorites.includes(selectedAlbum.photos[selectedPhotoIndex]) && "fill-current")} />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => downloadWithWatermark(selectedAlbum.photos[selectedPhotoIndex], selectedAlbum.title)}
                  className="w-14 h-14 rounded-2xl backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Download className="w-6 h-6" />
                </Button>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowInfoModal(true)}
                  className="w-14 h-14 rounded-2xl backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Info className="w-6 h-6" />
                </Button>

                <div className="w-[1px] h-10 bg-white/10 mx-2" />

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-red-500 text-white transition-all shadow-xl"
                >
                  <X className="w-7 h-7" />
                </Button>
              </div>
            </div>

            {/* Main Area with Navigation */}
            <div className="flex-1 relative flex items-center justify-center p-8 group">
              {/* Navigation Arrows */}
              <button 
                className="absolute left-12 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 z-30"
                onClick={() => setSelectedPhotoIndex(i => i !== null && i > 0 ? i - 1 : (selectedAlbum?.photos.length || 1) - 1)}
              >
                <ChevronLeft className="w-12 h-12" />
              </button>

              <button 
                className="absolute right-12 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 z-30"
                onClick={() => setSelectedPhotoIndex(i => i !== null && i < (selectedAlbum?.photos.length || 1) - 1 ? i + 1 : 0)}
              >
                <ChevronRight className="w-12 h-12" />
              </button>

              <div className="relative max-w-full max-h-full flex items-center justify-center p-12">
                <WatermarkOverlay title={selectedAlbum.title} size="large" />
                <motion.img
                  key={`lightbox-${selectedPhotoIndex}`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  src={getImageUrl(selectedAlbum.photos[selectedPhotoIndex])}
                  className="max-w-full max-h-[75vh] object-contain rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5"
                />
                
                {/* Photo Counter */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                  {selectedPhotoIndex + 1} <span className="mx-2 opacity-30">/</span> {selectedAlbum.photos.length} fotos
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
