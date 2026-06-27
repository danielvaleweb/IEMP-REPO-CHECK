import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search,
  Play,
  X,
  Plus,
  ArrowLeft,
  Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, orderBy, doc, deleteDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { MovieCard } from "@/components/movies/MovieCard";
import { cn, getImageUrl } from "@/lib/utils";
import { useCachedCollection, useCachedDoc } from "@/hooks/useFirestore";
import { firestoreService } from "@/services/firestoreService";

const DEFAULT_VIDEOS = [
  {
    id: "M7lc1UVf-VE",
    title: "Culto da Família - Ministério Profecia",
    badge: "Culto",
    description: "Assista à mensagem inspiradora e abençoada do Ministério Profecia para a sua família.",
    thumbnail: "https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg",
    published: "Recentemente",
    link: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
    tags: ["Pregação", "Família", "Louvor"],
    category: "PREGAÇÃO"
  },
  {
    id: "aqz-KE-bpKQ",
    title: "Culto de Celebração e Adoração",
    badge: "Culto",
    description: "Venha adorar a Deus conosco em mais um culto repleto da presença do Espírito Santo.",
    thumbnail: "https://img.youtube.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    published: "Recentemente",
    link: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    tags: ["Adoração", "Celebração"],
    category: "PREGAÇÃO"
  },
  {
    id: "jNQXAC9IVRw",
    title: "Mensagem de Fé e Esperança",
    badge: "Mensagem",
    description: "Uma palavra edificante para fortalecer a sua fé e a caminhada cristã diária.",
    thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    published: "Recentemente",
    link: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    tags: ["Palavra", "Fé"],
    category: "PREGAÇÃO"
  },
  {
    id: "M7lc1UVf-VE",
    title: "Culto de Oração e Libertação",
    badge: "Culto",
    description: "Um tempo poderoso de clamor, libertação e comunhão com Deus.",
    thumbnail: "https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg",
    published: "Recentemente",
    link: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
    tags: ["Oração", "Libertação"],
    category: "PREGAÇÃO"
  },
  {
    id: "aqz-KE-bpKQ",
    title: "Escola Bíblica Dominical - Ensinamentos",
    badge: "EBD",
    description: "Aprofunde seu conhecimento na Palavra de Deus através de nossos estudos bíblicos.",
    thumbnail: "https://img.youtube.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    published: "Recentemente",
    link: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    tags: ["Estudo", "EBD"],
    category: "EBD"
  }
];

export default function Videos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videos, setVideos] = useState<any[]>(DEFAULT_VIDEOS);
  const [myList, setMyList] = useState<any[]>([]);
  const [myListIds, setMyListIds] = useState<string[]>([]);
  const { favorites, favoriteIds, toggleFavorite: toggleFavoriteCtx, isFavorite } = useFavorites();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("TODOS");
  const [filterDate, setFilterDate] = useState("");
  const [filterOrganizer, setFilterOrganizer] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [config, setConfig] = useState<any>({ videoCardsEnabled: true });
  const [similarVideos, setSimilarVideos] = useState<any[]>([]);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [activeSimilarVideo, setActiveSimilarVideo] = useState<any | null>(null);

  // Use Cached Hooks
  const { data: generalSettings } = useCachedDoc<any>("settings", "general", 1000 * 60 * 60);
  const { data: videosData } = useCachedCollection<any>("videos", [orderBy("createdAt", "desc")], 1000 * 60 * 15);

  useEffect(() => {
    if (generalSettings) {
      setConfig(generalSettings);
    }
  }, [generalSettings]);

  useEffect(() => {
    if (videosData && videosData.length > 0) {
      setVideos(videosData.map(data => {
        const url = data.url || "";
        const getYoutubeId = (u: string) => {
          if (!u) return null;
          if (u.length === 11 && !u.includes('/') && !u.includes('?')) return u;
          if (u.includes("/live/")) {
            const liveMatch = u.match(/\/live\/([^#&?]+)/);
            if (liveMatch && liveMatch[1]) return liveMatch[1];
          }
          if (u.includes("/shorts/")) {
            const shortsMatch = u.match(/\/shorts\/([^#&?]+)/);
            if (shortsMatch && shortsMatch[1]) return shortsMatch[1];
          }
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
          const match = u.match(regExp);
          return (match && match[2].length === 11) ? match[2] : null;
        };
        const parsedId = getYoutubeId(url);
        const videoId = parsedId || data.id;
        const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('pt-BR') : "";
        let published = data.publishedAt || data.published || createdAtDate;
        
        // Normalize DD/MM/AA to DD/MM/AAAA
        const dateMatch = published.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
        if (dateMatch) {
          published = `${dateMatch[1]}/${dateMatch[2]}/20${dateMatch[3]}`;
        }
        
        return {
          id: videoId,
          firestoreId: data.id,
          ...data,
          published,
          createdAtDate,
          thumbnail: getImageUrl(data.thumbnail) || (parsedId ? `https://img.youtube.com/vi/${parsedId}/maxresdefault.jpg` : "/thumb-padrao.jpg"),
          tags: data.tags || (data.title?.toLowerCase().includes("pregação") ? ["pregação"] : []),
          category: data.category || (data.title?.toLowerCase().includes("pregação") ? "pregação" : "geral")
        };
      }));
    } else if (videosData && videosData.length === 0) {
      setVideos(DEFAULT_VIDEOS);
    }
  }, [videosData]);

  useEffect(() => {
    let isMounted = true;
    const fetchMyList = async () => {
      if (!user) {
        setMyList([]);
        setMyListIds([]);
        return;
      }
      try {
        const cacheKey = `mylist_${user.uid}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const list = JSON.parse(cached);
          setMyList(list);
          setMyListIds(list.map((v: any) => v.id));
        }

        const snapshot = await firestoreService.getCollection<any>(`users/${user.uid}/myList`, [], 1000 * 60 * 5);
        if (isMounted) {
          setMyList(snapshot);
          setMyListIds(snapshot.map(v => v.id));
          sessionStorage.setItem(cacheKey, JSON.stringify(snapshot));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/myList`);
      }
    };
    
    fetchMyList();
    return () => { isMounted = false; };
  }, [user]);

  const handleToggleMyList = async (e: React.MouseEvent, video: any) => {
    e.stopPropagation();
    if (!user) {
      navigate('/admin?message=precisamos que você esteja logado para adicionar à sua lista');
      return;
    }

    const docRef = doc(db, "users", user.uid, "myList", video.id);
    if (myListIds.includes(video.id)) {
      await deleteDoc(docRef);
    } else {
      const cleanVideo = Object.fromEntries(Object.entries(video).filter(([_, v]) => v !== undefined));
      await setDoc(docRef, cleanVideo);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, video: any) => {
    e.stopPropagation();
    if (!user) {
      navigate('/admin?message=precisamos que você esteja logado para favoritar conteúdos');
      return;
    }
    await toggleFavoriteCtx({
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnail || "",
      published: video.published || "",
      link: video.link || `https://www.youtube.com/watch?v=${video.id}`,
      category: "video"
    });
  };

  const filteredVideos = videos.filter(v => {
    const searchMatch = v.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      v.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // category check
    let categoryMatch = true;
    if (filterCategory !== "TODOS") {
      categoryMatch = v.tags?.some((t: string) => t.toUpperCase() === filterCategory.toUpperCase()) || 
                      v.category?.toUpperCase() === filterCategory.toUpperCase();
    }

    // organizer check
    let organizerMatch = true;
    if (filterOrganizer.trim()) {
      organizerMatch = v.organizer?.toLowerCase().includes(filterOrganizer.toLowerCase());
    }

    // date check
    let dateMatch = true;
    if (filterDate.trim()) {
      dateMatch = v.publishedAt?.includes(filterDate.trim()) || v.published?.includes(filterDate.trim()) || v.createdAtDate?.includes(filterDate.trim());
    }

    return searchMatch && categoryMatch && organizerMatch && dateMatch;
  });

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    if (url.includes("/live/")) {
      const liveMatch = url.match(/\/live\/([^#&?]+)/);
      if (liveMatch && liveMatch[1]) return liveMatch[1];
    }
    if (url.includes("/shorts/")) {
      const shortsMatch = url.match(/\/shorts\/([^#&?]+)/);
      if (shortsMatch && shortsMatch[1]) return shortsMatch[1];
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleShowSimilar = (video: any) => {
    setActiveSimilarVideo(video);
    
    const similar = videos.filter(v => {
      if (v.id === video.id) return false;
      
      // If the current video has tags, find videos with ANY matching tag
      if (video.tags && video.tags.length > 0) {
        return v.tags?.some((t: string) => video.tags.includes(t)) || 
               video.tags.some((t: string) => v.title?.toLowerCase().includes(t.toLowerCase()));
      }
      
      // Fallback logic for legacy/untagged videos
      const tagToMatch = video.title?.toLowerCase().includes("pregação") ? "pregação" : "geral";
                       
      return v.category === tagToMatch || 
             v.title?.toLowerCase().includes(tagToMatch.toLowerCase());
    }).slice(0, 9);
    
    setSimilarVideos(similar);
    setShowSimilarModal(true);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white pt-24 pb-20 px-4 md:px-12">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Vídeos</h1>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text"
              placeholder="Títulos, pregadores, séries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-cinza-input border border-white/10 rounded-full pl-12 pr-6 text-sm focus:outline-none focus:border-[#BF76FF]/50 transition-all"
            />
          </div>
        </div>

        {/* My List Section */}
        {myList.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest pl-1">Assistir Mais Tarde</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 relative z-10 overflow-visible"> {/** Assistir Mais Tarde Grid */}
              {myList.map((video, idx) => (
                <MovieCard 
                  key={`mylist-${video.id}`}
                  item={video}
                  type="video"
                  idx={idx}
                  onClick={() => setSelectedVideo(video)}
                  onAddToList={handleToggleMyList}
                  onFavorite={handleToggleFavorite}
                  onShowSimilar={handleShowSimilar}
                  isInList={true}
                  isFavorited={isFavorite(video.id)}
                  showEffects={config.videoCardsEnabled}
                />
              ))}
            </div>
          </section>
        )}

        <div className="h-[1px] bg-[#BF76FF] w-full mt-12 mb-8" />

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Categoria</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full h-12 bg-cinza-input/40 border border-[#BF76FF]/20 rounded-full px-4 text-sm focus:outline-none focus:border-[#BF76FF]/50 transition-all text-white"
            >
              <option value="TODOS">Todas</option>
              <option value="PREGAÇÃO">Pregações</option>
              <option value="EVENTO">Eventos</option>
              <option value="LIVE">Live</option>
              <option value="PODCAST">Podcast</option>
              <option value="DISCIPULADO">Discipulado</option>
              <option value="EBD">EBD</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Organizador / Preletor</label>
            <input
              type="text"
              placeholder="Nome do organizador..."
              value={filterOrganizer}
              onChange={(e) => setFilterOrganizer(e.target.value)}
              className="w-full h-12 bg-cinza-input/40 border border-[#BF76FF]/20 rounded-full px-4 text-sm focus:outline-none focus:border-[#BF76FF]/50 transition-all text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Data (DD/MM/AAAA)</label>
            <input
              type="text"
              placeholder="Ex: 01/12/2023"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full h-12 bg-cinza-input/40 border border-[#BF76FF]/20 rounded-full px-4 text-sm focus:outline-none focus:border-[#BF76FF]/50 transition-all text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* All Videos Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest pl-1">
            {searchTerm ? `Resultados para "${searchTerm}"` : "Todos os Vídeos"}
          </h2>
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 relative z-10 overflow-visible"> {/** Todos Vídeos Grid */}
              {filteredVideos.map((video, idx) => (
                <MovieCard 
                  key={`video-${video.id}`}
                  item={video}
                  type="video"
                  idx={idx}
                  onClick={() => setSelectedVideo(video)}
                  onAddToList={handleToggleMyList}
                  onFavorite={handleToggleFavorite}
                  onShowSimilar={handleShowSimilar}
                  isInList={myListIds.includes(video.id)}
                  isFavorited={isFavorite(video.id)}
                  showEffects={config.videoCardsEnabled}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-500">
              <p className="text-lg">Nenhum vídeo encontrado para sua busca.</p>
            </div>
          )}
        </section>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl bg-[#181818] rounded-2xl overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-white hover:text-black transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeId(selectedVideo.url)}?autoplay=1`}
                  title={selectedVideo.title}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              
              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold">{selectedVideo.title}</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleToggleMyList(e, selectedVideo)}
                      className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all border",
                        myListIds.includes(selectedVideo.id) 
                          ? "bg-gradient-to-r from-[#BF76FF] to-purple-800 text-white border-transparent hover:opacity-90 shadow-[0_0_20px_rgba(191,118,255,0.4)]" 
                          : "bg-white/10 text-white hover:bg-white/20 border-white/20"
                      )}
                    >
                      {myListIds.includes(selectedVideo.id) ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      {myListIds.includes(selectedVideo.id) ? "Adicionado!" : "Assistir Depois"}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="text-green-500 font-bold">98% Relevante</span>
                  {selectedVideo.tags && selectedVideo.tags.length > 0 ? (
                    selectedVideo.tags.map((tag: string, i: number) => (
                      <span key={i} className="text-[#BF76FF] font-bold">{tag}</span>
                    ))
                  ) : (
                    <span>{selectedVideo.badge || "Série"}</span>
                  )}
                  <span className="border border-gray-600 px-1 rounded-sm">HD</span>
                </div>
                <p className="text-lg text-gray-300 leading-relaxed max-w-3xl">
                  {selectedVideo.description || "Assista a esta mensagem inspiradora da Igreja Batista Ministério Profecia."}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSimilarModal && activeSimilarVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-md"
            onClick={() => setShowSimilarModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#181818] w-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative p-6 md:p-8 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-primary/20 to-transparent">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    Conteúdo Semelhante
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">Relacionado a: <span className="text-white font-bold">{activeSimilarVideo.title}</span></p>
                </div>
                <button 
                  onClick={() => setShowSimilarModal(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all hover:rotate-90"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-[#141414]">
                {similarVideos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    {similarVideos.map((item, idx) => (
                      <MovieCard
                        key={`similar-video-${item.id}-${idx}`}
                        item={item}
                        type="video"
                        idx={idx}
                        onClick={() => {
                          setShowSimilarModal(false);
                          setSelectedVideo(item);
                        }}
                        onAddToList={handleToggleMyList}
                        onFavorite={handleToggleFavorite}
                        onShowSimilar={handleShowSimilar}
                        isInList={myListIds.includes(item.id)}
                        isFavorited={isFavorite(item.id)}
                        isSimilarCard={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-gray-500 font-medium">Nenhum conteúdo semelhante encontrado.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
