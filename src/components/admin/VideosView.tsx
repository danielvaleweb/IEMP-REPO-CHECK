import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Video, 
  Play, 
  Search,
  Save,
  X,
  Edit,
  Youtube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { cn } from "@/lib/utils";

export function VideosView({ isDark }: { isDark: boolean }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<{
    title: string;
    url: string;
    thumbnail: string;
    tags: string[];
    description: string;
  }>({
    title: "",
    url: "",
    thumbnail: "",
    tags: [],
    description: ""
  });

  const predefinedTags = ["PREGAÇÃO", "LIVE", "EVENTO", "DISCIPULADO", "EBD", "PODCAST"];

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  useEffect(() => {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setVideos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "videos"));

    return () => unsubscribe();
  }, []);

  const handleSaveVideo = async () => {
    if (!formData.title || !formData.url) return;
    
    try {
      if (editingVideo) {
        await updateDoc(doc(db, "videos", editingVideo.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "videos"), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      setFormData({ title: "", url: "", thumbnail: "", tags: [], description: "" });
      setIsAdding(false);
      setEditingVideo(null);
    } catch (err) {
      handleFirestoreError(err, editingVideo ? OperationType.UPDATE : OperationType.CREATE, "videos");
    }
  };

  const startEdit = (video: any) => {
    setEditingVideo(video);
    
    // Normalize old 'badge' field to 'tags' if tags are not present
    let initialTags = video.tags || [];
    if (initialTags.length === 0 && video.badge) {
      initialTags = [video.badge.toUpperCase()];
    }

    setFormData({
      title: video.title || "",
      url: video.url || "",
      thumbnail: video.thumbnail || "",
      tags: initialTags,
      description: video.description || ""
    });
    setIsAdding(true);
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, "videos", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `videos/${id}`);
    }
  };

  const filteredVideos = videos.filter(v => 
    v.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className={cn("p-8 md:p-10 rounded-[32px] md:rounded-[48px] border transition-all space-y-10", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-sm")}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-black")}>Gerenciamento de Vídeos</h2>
          <p className={cn("text-sm", isDark ? "text-white/40" : "text-gray-500")}>Adicione vídeos manualmente para a galeria do site.</p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white rounded-2xl h-12 px-6 font-bold shadow-xl shadow-[#7300FF]/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Vídeo
        </Button>
      </div>

      <div className="space-y-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BF76FF]" />
            <Input 
            placeholder="Pesquisar vídeos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn("h-14 pl-12 rounded-2xl border transition-all shadow-none", isDark ? "bg-black border-white/5 text-white placeholder:text-gray-500" : "bg-white border-black/5 text-black")}
          />
        </div>

        {isAdding && (
          <Card className={cn("p-8 rounded-[32px] border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300", isDark ? "bg-[#1A1A1A] text-white" : "bg-white text-black")}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-2xl uppercase tracking-tight">{editingVideo ? "Editar" : "Cadastrar Novo"} Vídeo</h3>
              <button onClick={() => { setIsAdding(false); setEditingVideo(null); }} className={cn("p-2 rounded-full transition-colors", isDark ? "hover:bg-white/5" : "hover:bg-black/5")}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDark ? "text-white/40" : "text-gray-500")}>Título do Vídeo</label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Mensagem de Domingo - Fé inabalável"
                  className={cn("h-14 rounded-2xl border transition-all shadow-none", isDark ? "bg-black/60 border-white/5 text-white placeholder:text-gray-500" : "bg-white border-black/5 text-black")}
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDark ? "text-white/40" : "text-gray-500")}>URL do YouTube</label>
                <Input 
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={cn("h-14 rounded-2xl border transition-all shadow-none", isDark ? "bg-black/60 border-white/5 text-white placeholder:text-gray-500" : "bg-white border-black/5 text-black")}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDark ? "text-white/40" : "text-gray-500")}>TAGS / CATEGORIAS (Selecione ou digite + Enter)</label>
                  <div className="flex flex-wrap gap-2 mb-2 px-1">
                     {predefinedTags.map(tag => (
                       <button
                         key={`preset-tag-${tag}`}
                         onClick={() => toggleTag(tag)}
                         className={cn("px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all uppercase tracking-wider", formData.tags.includes(tag) ? "bg-[#BF76FF] border-[#BF76FF] text-white shadow-md shadow-[#BF76FF]/20" : "border-gray-500/30 text-gray-400 hover:border-gray-400")}
                         type="button"
                       >
                         {tag}
                       </button>
                     ))}
                  </div>
                  <div className={cn("flex flex-wrap gap-2 p-2 min-h-[56px] rounded-2xl border transition-all shadow-none items-center", isDark ? "bg-black/60 border-white/5" : "bg-white border-black/5")}>
                    {formData.tags.filter(t => !predefinedTags.includes(t)).map(tag => (
                      <span key={`custom-tag-${tag}`} className="px-3 py-1 bg-[#BF76FF]/20 text-[#BF76FF] text-[11px] font-bold rounded-lg flex items-center gap-1.5 uppercase tracking-wider border border-[#BF76FF]/30">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                      </span>
                    ))}
                    <input 
                      type="text"
                      placeholder="Adicionar nova tag personalizada..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const newTag = e.currentTarget.value.trim().toUpperCase();
                          if (newTag && !formData.tags.includes(newTag)) {
                            setFormData({...formData, tags: [...formData.tags, newTag]});
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      className={cn("flex-1 bg-transparent border-none outline-none text-sm px-2 min-w-[200px] h-full", isDark ? "text-white placeholder:text-gray-600" : "text-black placeholder:text-gray-400")}
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDark ? "text-white/40" : "text-gray-500")}>Thumbnail Personalizada (Opcional)</label>
                  <Input 
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                    placeholder="Deixe vazio para usar a do YouTube"
                    className={cn("h-14 rounded-2xl border transition-all shadow-none", isDark ? "bg-black/60 border-white/5 text-white placeholder:text-gray-500" : "bg-white border-black/5 text-black")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDark ? "text-white/40" : "text-gray-500")}>Descrição (Opcional)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Uma breve descrição sobre o vídeo..."
                  className={cn("w-full h-32 rounded-2xl border transition-all shadow-none p-4 resize-none", isDark ? "bg-black/60 border-white/5 text-white placeholder:text-gray-500" : "bg-white border-black/5 text-black hover:border-[#BF76FF]/50 focus:border-[#BF76FF]")}
                />
              </div>
              <Button 
                onClick={handleSaveVideo}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] text-white font-black uppercase tracking-widest shadow-xl shadow-[#7300FF]/20 mt-4 transition-all active:scale-[0.98]"
              >
                <Save className="w-5 h-5 mr-2" /> {editingVideo ? "Salvar Alterações" : "Salvar Vídeo"}
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredVideos.map((video) => {
            const ytId = getYoutubeId(video.url);
            const thumb = video.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : "");
            
            return (
              <Card key={video.id} className={cn("group overflow-hidden rounded-[32px] border transition-all aspect-[9/13] relative flex flex-col shadow-none", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-md hover:shadow-xl")}>
                {/* Clean Image Architecture - Grains color on hover */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={thumb} 
                    className={cn("w-full h-full object-cover transition-all duration-[2s] opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110")} 
                    alt="" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity group-hover:opacity-40" />
                </div>

                {/* Action Icons - Appearing top right on hover */}
                <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 text-white">
                  <button 
                    onClick={() => window.open(video.url, "_blank")}
                    title="Visualizar no YouTube"
                    className="h-10 w-10 flex items-center justify-center transition-all text-white hover:text-red-500 bg-transparent border-none shadow-none outline-none p-0 group/icon"
                  >
                    <Youtube className="w-6 h-6 transition-colors" />
                  </button>
                  <button 
                    onClick={() => startEdit(video)}
                    title="Editar"
                    className="h-10 w-10 flex items-center justify-center transition-all text-white hover:text-[#BF76FF] bg-transparent border-none shadow-none outline-none p-0"
                  >
                    <Edit className="w-6 h-6 transition-colors" />
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm("Tem certeza que deseja excluir este vídeo?")) {
                        handleDeleteVideo(video.id);
                      }
                    }}
                    title="Excluir"
                    className="h-10 w-10 flex items-center justify-center transition-all text-white hover:text-red-500 bg-transparent border-none shadow-none outline-none p-0"
                  >
                    <Trash2 className="w-6 h-6 transition-colors" />
                  </button>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 flex flex-col h-full p-8">
                  <div className="mt-auto">
                    <h4 className="font-black text-2xl text-white uppercase tracking-tight leading-tight line-clamp-3 drop-shadow-lg">{video.title}</h4>
                  </div>
                </div>
              </Card>
            );
          })}

          {filteredVideos.length === 0 && !isAdding && (
            <div className="col-span-full py-32 text-center opacity-20">
              <Video className="w-20 h-20 text-[#BF76FF] mx-auto mb-4" />
              <p className="font-extrabold text-xl uppercase tracking-widest">Nenhum vídeo encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
