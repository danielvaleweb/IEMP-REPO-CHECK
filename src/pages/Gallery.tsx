import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Clock,
  Trash2,
  Check,
  Slash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, setDoc, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { cn, getImageUrl } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";

interface Album {
  id: string;
  title: string;
  date: string;
  cover: string;
  photos: string[];
}

interface RemovalRequest {
  id: string;
  photoUrl: string;
  albumId: string;
  requestedBy: string;
  status: 'pending' | 'removed' | 'kept';
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
  const { user, profile, isAdmin } = useAuth();
  const { favoriteIds, toggleFavorite: toggleFavoriteCtx } = useFavorites();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const queryAlbumId = queryParams.get('album');
  const stateAlbumId = location.state?.selectedAlbumId || queryAlbumId;
  const queryPhotoUrl = queryParams.get('photo');
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [albums, setAlbums] = useState<Album[]>([]);
  const [removalRequests, setRemovalRequests] = useState<RemovalRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"todos" | "favoritos">("todos");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showRemovedFeedback, setShowRemovedFeedback] = useState(false);
  
  const isPhotoMarkedForRemoval = useCallback((photoUrl: string) => {
    return removalRequests.find(r => r.photoUrl === photoUrl);
  }, [removalRequests]);

  const visiblePhotos = useMemo(() => {
    if (!selectedAlbum) return [];
    return selectedAlbum.photos.filter(photo => {
      const request = isPhotoMarkedForRemoval(photo);
      
      // If approved removal, hide for EVERYONE
      if (request && request.status === 'removed') return false;
      
      // If pending, hide for standard users, keep visible for admins (so they can approve)
      if (request && request.status === 'pending') {
        return isAdmin;
      }

      return true;
    });
  }, [selectedAlbum, removalRequests, isAdmin, isPhotoMarkedForRemoval]);

  // Deep link to photo
  useEffect(() => {
    if (selectedAlbum && queryPhotoUrl && visiblePhotos.length > 0) {
      const idx = visiblePhotos.indexOf(queryPhotoUrl);
      if (idx !== -1) {
        // Calcular a página correta
        const page = Math.floor(idx / itemsPerPage) + 1;
        setCurrentPage(page);
        setSelectedPhotoIndex(idx);
        
        // Limpar a query para não reabrir
        const newParams = new URLSearchParams(location.search);
        newParams.delete('photo');
        navigate({ search: newParams.toString() }, { replace: true, state: location.state });
      }
    }
  }, [selectedAlbum, queryPhotoUrl, visiblePhotos, location.search, navigate, location.state]);
  
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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "posts");
    });

    const qRemovals = query(collection(db, "photo_removals"));
    const unsubRemovals = onSnapshot(qRemovals, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as RemovalRequest[];
      setRemovalRequests(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "photo_removals");
    });

    return () => {
      unsubscribe();
      unsubRemovals();
    };
  }, [stateAlbumId]);

  const handleToggleFavorite = (album: Album, photoUrl: string) => {
    toggleFavoriteCtx({
      id: photoUrl,
      title: album.title,
      thumbnail: photoUrl,
      published: album.date,
      link: photoUrl,
      category: "photo"
    });
  };

  const handleRequestRemoval = async (photoUrl: string, albumId: string) => {
    if (!user) return;
    
    try {
      const requestId = `${user.uid}_${btoa(photoUrl).substring(0, 50)}`;
      await setDoc(doc(db, "photo_removals", requestId), {
        photoUrl,
        albumId,
        requestedBy: user.uid,
        requestedByName: profile?.name || "Visitante",
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Notificar Administradores (usando 'admin' para que todos vejam no dashboard)
      await addDoc(collection(db, "notifications"), {
        userId: "admin",
        title: "Solicitação de Remoção de Foto",
        message: `${profile?.name || "Um usuário"} solicitou a remoção de uma foto no álbum "${selectedAlbum?.title}".`,
        type: "gallery_removal",
        photoUrl,
        albumId,
        read: false,
        createdAt: serverTimestamp()
      });

      setShowInfoModal(false);
      setShowRemovedFeedback(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "photo_removals / notifications");
    }
  };

  const handleAdminAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const request = removalRequests.find(r => r.id === requestId);
      if (!request) return;

      if (action === 'approve') {
        const { updateDoc, arrayRemove } = await import("firebase/firestore");
        
        // 1. Atualizar o status da solicitação
        await setDoc(doc(db, "photo_removals", requestId), { status: 'removed', updatedAt: serverTimestamp() }, { merge: true });
        
        // 2. Remover a foto do álbum (post)
        const postRef = doc(db, "posts", request.albumId);
        await updateDoc(postRef, {
          gallery: arrayRemove(request.photoUrl)
        });

        // 3. Opcional: Se a foto removida for a capa, poderíamos atualizar a capa também, 
        // mas vamos focar na remoção da galeria por agora.
      } else {
        await deleteDoc(doc(db, "photo_removals", requestId));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `photo_removals / ${requestId}`);
    }
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

  const filteredAlbums = useMemo(() => {
    return albums.filter(album => 
      album.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.date.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [albums, searchTerm]);

  const favoritePhotos = useMemo(() => {
    const photos: { url: string, album: Album }[] = [];
    albums.forEach(album => {
      album.photos.forEach(photo => {
        if (favoriteIds.includes(photo)) {
          photos.push({ url: photo, album });
        }
      });
    });
    return photos;
  }, [albums, favoriteIds]);

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

  const paginatedPhotos = visiblePhotos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(visiblePhotos.length / itemsPerPage);

  return (
    <div className="pt-24 pb-12 min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        
        {!selectedAlbum ? (
          <div className="space-y-8">
            {/* Header with Search and Categories */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-16">
              <div className="flex bg-white/5 p-1.5 rounded-2xl gap-1">
                <button 
                  onClick={() => setActiveCategory("todos")}
                  className={cn(
                    "px-6 h-11 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all",
                    activeCategory === "todos" ? "bg-primary text-black" : "text-gray-400 hover:text-white"
                  )}
                >
                  Álbuns
                </button>
                <button 
                  onClick={() => setActiveCategory("favoritos")}
                  className={cn(
                    "px-6 h-11 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2",
                    activeCategory === "favoritos" ? "bg-red-500 text-white" : "text-gray-400 hover:text-white"
                  )}
                >
                  <Heart className={cn("w-3.5 h-3.5", activeCategory === "favoritos" && "fill-current")} /> Favoritos
                </button>
              </div>

              <div className="flex-1 w-full relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary w-5 h-5 z-10" />
                <input 
                  type="text"
                  placeholder={activeCategory === "todos" ? "Pesquisar por álbum..." : "Pesquisar em favoritos..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-cinza-input border-2 border-white/5 rounded-2xl h-14 pl-14 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all font-medium"
                />
              </div>
            </div>

            {activeCategory === "todos" ? (
              loading ? (
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="absolute bottom-4 left-6 right-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                          <div className="flex items-center gap-2 text-primary mb-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{album.date}</span>
                          </div>
                          <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors leading-tight uppercase tracking-tighter">
                            {album.title}
                          </h3>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                  <Camera className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nenhum álbum encontrado.</p>
                </div>
              )
            ) : (
              /* Favorites View */
              favoritePhotos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {favoritePhotos.map(({ url, album }, idx) => (
                    <motion.div
                      key={`fav-${idx}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="aspect-square rounded-[2rem] overflow-hidden border border-white/10 relative group"
                    >
                      <WatermarkOverlay title={album.title} />
                      <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3">
                        <Button 
                          onClick={() => handleToggleFavorite(album, url)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12 p-0"
                        >
                          <Heart className="w-5 h-5 fill-current" />
                        </Button>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{album.title}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                  <Heart className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Você não tem fotos favoritas.</p>
                </div>
              )
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
                <ArrowRight className="w-4 h-4 rotate-180" /> Voltar
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
                {paginatedPhotos.map((photo, idx) => {
                  const req = isPhotoMarkedForRemoval(photo);
                  return (
                    <div 
                      key={`mobile-photo-${idx}`}
                      className="min-w-[85vw] aspect-[3/4] rounded-[2.5rem] overflow-hidden snap-center relative shadow-2xl bg-white/5 border border-white/10"
                    >
                      <WatermarkOverlay title={selectedAlbum.title} />
                      <img src={getImageUrl(photo)} alt="" className="w-full h-full object-cover" />
                      
                      {isAdmin && req && (
                        <div className="absolute top-4 left-4 z-20 bg-amber-500 text-black px-4 py-1.5 rounded-full font-black text-[10px] uppercase flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" /> Solicitação de Remoção
                        </div>
                      )}

                      {/* Corner Actions */}
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
                          onClick={() => {
                            setSelectedPhotoIndex(idx);
                            setShowInfoModal(true);
                          }}
                          className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl"
                        >
                          <Info className="w-5 h-5" />
                        </Button>
                      </div>
                      
                      <div className="absolute top-6 right-6">
                        <Button 
                          size="icon" 
                          onClick={() => handleToggleFavorite(selectedAlbum, photo)}
                          className={cn(
                            "w-12 h-12 rounded-2xl backdrop-blur-md border border-white/20 transition-all",
                            favoriteIds.includes(photo) ? "bg-red-500 text-white border-red-500" : "bg-white/5 text-white"
                          )}
                        >
                          <Heart className={cn("w-5 h-5", favoriteIds.includes(photo) && "fill-current")} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Desktop Grid Mode */
              <div className="space-y-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {paginatedPhotos.map((photo, idx) => {
                    const actualIdx = (currentPage - 1) * itemsPerPage + idx;
                    const req = isPhotoMarkedForRemoval(photo);
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
                        
                        {isAdmin && req && (
                           <div className="absolute top-4 left-4 z-20 bg-amber-500 text-black px-3 py-1 rounded-full font-black text-[8px] uppercase flex items-center gap-1.5 shadow-xl">
                            <AlertCircle className="w-2.5 h-2.5" /> Remoção Pendente
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="icon" className="w-14 h-14 rounded-full bg-primary text-black transform scale-0 group-hover:scale-100 transition-transform duration-300">
                            <ImageIcon className="w-6 h-6" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

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
                            currentPage === i + 1 ? "bg-primary text-black" : "text-gray-500 hover:text-white"
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
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Termos do Site</h3>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Direitos de Imagem e Autorização</p>
                </div>
              </div>

              <div className="space-y-6 text-gray-300">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 shadow-inner max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed">
                      Todas as fotografias exibidas nesta galeria são de propriedade exclusiva do <span className="text-white font-bold">Ministério Profecia</span>. O download é permitido apenas para uso pessoal em redes sociais pelo proprietário, devendo ser mantida a marca d'água oficial.
                    </p>
                    <p className="text-sm leading-relaxed text-red-400 font-medium">
                      O uso de imagem de terceiros sem a devida permissão pode configurar violação de direitos de personalidade, conforme o Artigo 20 do Código Civil Brasileiro, sujeitando o infrator às sanções legais.
                    </p>
                    <p className="text-sm leading-relaxed">
                      Ao utilizar este serviço, você reconhece que a igreja possui autorização implícita para o registro fotográfico dos cultos e eventos públicos.
                    </p>
                    
                    <div className="h-[1px] bg-white/10 my-4" />
                    
                    <h4 className="font-bold text-white uppercase text-xs tracking-widest flex items-center gap-2">
                       Termo de autorização da igreja
                    </h4>
                    
                    <p className="text-[13px] leading-relaxed opacity-70">
                      Informamos que, ao participar das programações e eventos, poderão ser realizadas captação de imagens e vídeos para divulgação institucional e evangelística em nossos meios de comunicação. Ao permanecer no local, o participante autoriza o uso de sua imagem e voz nos termos descritos, conforme a <span className="text-white font-bold">LGPD (Lei nº 13.709/2018)</span>.
                    </p>
                    <p className="text-[13px] leading-relaxed font-black text-white">
                      Mesmo assim você pode pedir para que retiraremos sua foto!
                    </p>
                    <p className="text-[11px] leading-relaxed font-light italic opacity-50">
                      A solicitação de remoção de fotos ou vídeos poderá ser realizada exclusivamente pela própria pessoa que aparece na imagem. Pedidos feitos por terceiros não serão atendidos.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {selectedPhotoIndex !== null && selectedAlbum && (
                    <Button 
                      className="w-full bg-red-500 hover:bg-red-600 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 group"
                      onClick={() => handleRequestRemoval(selectedAlbum.photos[selectedPhotoIndex], selectedAlbum.id)}
                    >
                      <AlertCircle className="w-5 h-5 group-hover:animate-pulse" /> Pedir para remover minha imagem
                    </Button>
                  )}
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

      {/* Feedback Remoção */}
      <AnimatePresence>
        {showRemovedFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 text-center"
            onClick={() => setShowRemovedFeedback(false)}
          >
            <div className="space-y-6">
              <div className="w-24 h-24 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto animate-bounce">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Sua foto foi excluída!</h3>
                <p className="text-gray-500 font-medium">Sua solicitação foi enviada. A imagem ficará oculta até a análise final de um administrador.</p>
              </div>
              <Button 
                onClick={() => setShowRemovedFeedback(false)}
                className="bg-red-500 hover:bg-red-600 text-white h-14 w-full rounded-2xl font-black uppercase tracking-widest text-xs"
              >
                Entendi
              </Button>
            </div>
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
            <div className="h-24 px-12 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent relative z-20">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{selectedAlbum.date}</span>
                <h4 className="text-2xl font-black uppercase tracking-tighter">{selectedAlbum.title}</h4>
              </div>

              <div className="flex items-center gap-3">
                 {/* Admin Actions */}
                 {isAdmin && isPhotoMarkedForRemoval(visiblePhotos[selectedPhotoIndex]) && (
                   <div className="flex bg-white/5 p-1 rounded-2xl gap-1 mr-4 border border-white/10">
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAdminAction(isPhotoMarkedForRemoval(visiblePhotos[selectedPhotoIndex])!.id, 'approve')}
                        className="h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-black uppercase text-[8px] tracking-widest"
                     >
                       <Trash2 className="w-3.5 h-3.5 mr-2" /> Aceitar Remoção
                     </Button>
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAdminAction(isPhotoMarkedForRemoval(visiblePhotos[selectedPhotoIndex])!.id, 'reject')}
                        className="h-10 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white font-black uppercase text-[8px] tracking-widest"
                     >
                       <Check className="w-3.5 h-3.5 mr-2" /> Recusar e Manter
                     </Button>
                   </div>
                 )}

                 <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleToggleFavorite(selectedAlbum, visiblePhotos[selectedPhotoIndex])}
                  className={cn(
                    "w-14 h-14 rounded-2xl backdrop-blur-md border border-white/10 transition-all",
                    favoriteIds.includes(visiblePhotos[selectedPhotoIndex]) ? "bg-red-500 text-white" : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Heart className={cn("w-6 h-6", favoriteIds.includes(visiblePhotos[selectedPhotoIndex]) && "fill-current")} />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => downloadWithWatermark(visiblePhotos[selectedPhotoIndex], selectedAlbum.title)}
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

            <div className="flex-1 relative flex items-center justify-center p-8 group">
              <button 
                className="absolute left-12 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 z-30"
                onClick={() => setSelectedPhotoIndex(i => i !== null && i > 0 ? i - 1 : (visiblePhotos.length - 1))}
              >
                <ChevronLeft className="w-12 h-12" />
              </button>

              <button 
                className="absolute right-12 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 z-30"
                onClick={() => setSelectedPhotoIndex(i => i !== null && i < (visiblePhotos.length - 1) ? i + 1 : 0)}
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
                  src={getImageUrl(visiblePhotos[selectedPhotoIndex])}
                  className="max-w-full max-h-[75vh] object-contain rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5"
                />
                
                {/* Photo Counter */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                  {selectedPhotoIndex + 1} <span className="mx-2 opacity-30">/</span> {visiblePhotos.length} fotos
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
