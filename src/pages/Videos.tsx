import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search,
  Play,
  X,
  Plus,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { db, auth, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { MovieCard } from "@/components/movies/MovieCard";
import { cn } from "@/lib/utils";

export default function Videos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);
  const [myListIds, setMyListIds] = useState<string[]>([]);
  const { favorites, favoriteIds, toggleFavorite: toggleFavoriteCtx, isFavorite } = useFavorites();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [config, setConfig] = useState<any>({ videoCardsEnabled: true });
  const [similarVideos, setSimilarVideos] = useState<any[]>([]);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [activeSimilarVideo, setActiveSimilarVideo] = useState<any | null>(null);

  useEffect(() => {
    // Load config
    const unsubConfig = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, "settings/general"));

    // Load videos
    const qVideos = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const unsubVideos = onSnapshot(qVideos, (snapshot) => {
      setVideos(snapshot.docs.map(doc => {
        const data = doc.data();
        const url = data.url || "";
        const videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : 
                        url.includes('youtu.be/') ? url.split('youtu.be/')[1] : url;
        return {
          id: videoId, // Use youtubeId as id for consistency with Home.tsx
          firestoreId: doc.id,
          ...data,
          thumbnail: data.thumbnail || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : ""),
          tags: data.tags || (data.title?.toLowerCase().includes("pregação") ? ["pregação"] : []),
          category: data.category || (data.title?.toLowerCase().includes("pregação") ? "pregação" : "geral")
        };
      }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "videos"));

    return () => {
      unsubConfig();
      unsubVideos();
    };
  }, []);

  useEffect(() => {
    let unsubMyList = () => {};

    if (user) {
      unsubMyList = onSnapshot(collection(db, "users", user.uid, "myList"), (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyList(list);
        setMyListIds(list.map(v => v.id));
      }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/myList`));
    } else {
      setMyList([]);
      setMyListIds([]);
    }

    return () => unsubMyList();
  }, [user]);

  const handleToggleMyList = async (e: React.MouseEvent, video: any) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    const docRef = doc(db, "users", user.uid, "myList", video.id);
    if (myListIds.includes(video.id)) {
      await deleteDoc(docRef);
    } else {
      await setDoc(docRef, video);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, video: any) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
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

  const filteredVideos = videos.filter(v => 
    v.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getYoutubeId = (url: string) => {
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
              className="w-full h-12 bg-black/40 border border-white/10 rounded-full pl-12 pr-6 text-sm focus:outline-none focus:border-[#BF76FF]/50 transition-all"
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
            <div className="h-px bg-white/5 w-full pt-8" />
          </section>
        )}

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
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white"
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
                        showEffects={true}
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
