import { useState, useEffect } from "react";
import { UploadImages } from "@/components/UploadImages";
import { 
  Plus, 
  Trash2, 
  Video, 
  Play, 
  Search,
  Save,
  X,
  Edit,
  Youtube,
  ChevronDown
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
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
  query, 
  orderBy, 
  serverTimestamp,
  limit
} from "firebase/firestore";
import { cn, getImageUrl } from "@/lib/utils";
import { firestoreService } from "@/services/firestoreService";

export function VideosView({ isDark }: { isDark: boolean }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [activeMobileMenuId, setActiveMobileMenuId] = useState<string | null>(null);
  const [videoLimit, setVideoLimit] = useState(4);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<{
    title: string;
    url: string;
    thumbnail: string;
    tags: string[];
    description: string;
    publishedAt: string;
    organizer: string;
  }>({
    title: "",
    url: "",
    thumbnail: "",
    tags: [],
    description: "",
    publishedAt: "",
    organizer: ""
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

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await firestoreService.getCollection<any>("videos", [orderBy("createdAt", "desc"), limit(videoLimit)], 1000 * 60 * 30);
      setVideos(data);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [videoLimit]);

  // Scroll to top when entering edit/add mode
  useEffect(() => {
    if (isAdding) {
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [isAdding]);

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
      firestoreService.clearCache("videos");
      await loadVideos();
      setFormData({ title: "", url: "", thumbnail: "", tags: [], description: "", publishedAt: "", organizer: "" });
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
      description: video.description || "",
      publishedAt: video.publishedAt || "",
      organizer: video.organizer || ""
    });
    setIsAdding(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "videos", deleteId));
      firestoreService.clearCache("videos");
      await loadVideos();
      setDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `videos/${deleteId}`);
    }
  };

  const filteredVideos = videos.filter(v => 
    v.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    if (url.length === 11 && !url.includes('/') && !url.includes('?')) return url;
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

  if (isAdding) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-10 pb-32 md:pb-36 animate-in fade-in duration-300">
        <div>
          <h2 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-black")}>
            {editingVideo ? "Editar Vídeo" : "Novo Vídeo"}
          </h2>
          <p className={cn("text-sm", isDark ? "text-white/40" : "text-gray-500")}>
            Preencha as informações do vídeo abaixo.
          </p>
        </div>

        <Card className={cn("p-8 rounded-[32px] border shadow-2xl", isDark ? "bg-[#1A1A1A] border-white/5 text-white" : "bg-white border-black/5 text-black")}>
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
                <UploadImages
                  maxFiles={1}
                  multiple={false}
                  value={formData.thumbnail}
                  onUploadComplete={(images) => setFormData({...formData, thumbnail: images[0]?.secure_url || ""})}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDark ? "text-white/40" : "text-gray-500")}>Data (DD/MM/AAAA)</label>
                <Input 
                  value={formData.publishedAt}
                  onChange={(e) => setFormData({...formData, publishedAt: e.target.value})}
                  placeholder="Ex: 01/12/2023"
                  className={cn("h-14 rounded-2xl border transition-all shadow-none", isDark ? "bg-black/60 border-white/5 text-white placeholder:text-gray-500" : "bg-white border-black/5 text-black")}
                />
              </div>
              <div className="space-y-2">
                <label className={cn("text-[10px] font-black uppercase tracking-widest ml-2", isDark ? "text-white/40" : "text-gray-500")}>Organizador (Opcional)</label>
                <Input 
                  value={formData.organizer}
                  onChange={(e) => setFormData({...formData, organizer: e.target.value})}
                  placeholder="Nome do preletor/organizador"
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
          </div>
        </Card>

        {/* Bottom Floating Save/Cancel Capsule — Video Edit/Add */}
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className={cn(
            "p-2.5 rounded-[24px] border backdrop-blur-xl shadow-2xl flex items-center gap-4 transition-all duration-300",
            isDark
              ? "bg-black/80 border-[#BF76FF]/30 shadow-[#BF76FF]/10"
              : "bg-white/80 border-[#BF76FF]/20 shadow-black/10"
          )}>
            <div className="pl-4 pr-1 hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                {editingVideo ? "Editar Vídeo" : "Novo Vídeo"}
              </p>
              <p className="text-[9px] text-[#BF76FF] font-bold">Você tem alterações pendentes</p>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setEditingVideo(null);
              }}
              className={cn(
                "rounded-xl h-11 px-5 font-bold text-xs transition-colors",
                isDark ? "text-white hover:bg-white/5 border border-white/10" : "text-black hover:bg-black/5 border border-black/10"
              )}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleSaveVideo}
              className={cn(
                "rounded-xl h-11 px-6 font-bold text-xs transition-all duration-300 min-w-[140px]",
                "bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] hover:opacity-90 text-white shadow-lg shadow-[#7300FF]/25"
              )}
            >
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredVideos.map((video) => {
            const ytId = getYoutubeId(video.url);
            const thumb = video.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : "");
            
            return (
              <Card key={video.id} className={cn("group overflow-hidden rounded-[32px] border transition-all aspect-[9/13] relative flex flex-col shadow-none", isDark ? "bg-[#1A1A1A] border-white/5" : "bg-white border-black/5 shadow-md hover:shadow-xl")}>
                {/* Clean Image Architecture - Grains color on hover */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={getImageUrl(thumb)} 
                    className={cn("w-full h-full object-cover transition-all duration-[2s] opacity-80 md:opacity-60 md:grayscale md:group-hover:grayscale-0 md:group-hover:opacity-100 md:group-hover:scale-110")} 
                    alt="" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity md:group-hover:opacity-40" />
                </div>

                {/* Desktop Action Icons - Appearing top right on hover */}
                <div className="absolute top-4 right-4 z-20 hidden md:flex gap-2 opacity-0 md:group-hover:opacity-100 transition-all duration-300 translate-y-2 md:group-hover:translate-y-0 text-white">
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
                    onClick={() => setDeleteId(video.id)}
                    title="Excluir"
                    className="h-10 w-10 flex items-center justify-center transition-all text-white hover:text-red-500 bg-transparent border-none shadow-none outline-none p-0 cursor-pointer"
                  >
                    <Trash2 className="w-6 h-6 transition-colors" />
                  </button>
                </div>

                {/* Mobile Persistent Edit Pencil Icon */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMobileMenuId(activeMobileMenuId === video.id ? null : video.id);
                  }}
                  className={cn(
                    "w-9 h-9 rounded-xl flex md:hidden items-center justify-center text-white bg-black/60 backdrop-blur-md transition-transform active:scale-95 absolute top-4 right-4 z-30 shadow-md",
                    activeMobileMenuId === video.id && "scale-90"
                  )}
                >
                  <Edit className="w-5 h-5" />
                </button>

                {/* Mobile Dynamic Actions Menu Popover */}
                {activeMobileMenuId === video.id && (
                  <>
                    <div 
                      className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMobileMenuId(null);
                      }}
                    />
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 gap-4 animate-in zoom-in-95 duration-200">
                      <p className="text-white text-xs font-black uppercase tracking-[0.2em] mb-2 border-b border-white/10 pb-2 w-full text-center">Opções</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMobileMenuId(null);
                          window.open(video.url, "_blank");
                        }}
                        className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-white/10 text-white font-bold hover:bg-white/20 active:scale-[0.97] transition-all text-sm border border-white/10"
                      >
                        <Youtube className="w-4.5 h-4.5" /> Visualizar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMobileMenuId(null);
                          startEdit(video);
                        }}
                        className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFE53B] to-[#00FFFF] text-black font-black active:scale-[0.97] transition-all text-sm border-none shadow-lg shadow-[#00FFFF]/10"
                      >
                        <Edit className="w-4.5 h-4.5 text-black" /> Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMobileMenuId(null);
                          setDeleteId(video.id);
                        }}
                        className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-red-500/20 text-red-500 font-bold hover:bg-red-500/30 active:scale-[0.97] transition-all text-sm border border-red-500/20"
                      >
                        <Trash2 className="w-4.5 h-4.5" /> Excluir
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMobileMenuId(null);
                        }}
                        className="w-full h-10 rounded-xl flex items-center justify-center text-gray-400 font-medium hover:text-white transition-colors text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}

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

        {videos.length > 0 && videos.length >= videoLimit && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => setVideoLimit(prev => prev + 4)}
              className={cn(
                "group relative flex items-center gap-3 px-8 h-12 rounded-2xl border font-black uppercase tracking-[0.2em] text-xs transition-all duration-300 active:scale-95",
                isDark
                  ? "bg-black/60 border-white/10 hover:border-[#BF76FF]/40 hover:bg-[#BF76FF]/5"
                  : "bg-white border-black/10 hover:border-[#BF76FF]/40 hover:bg-[#BF76FF]/5"
              )}
            >
              <ChevronDown className="w-4 h-4 text-[#BF76FF] group-hover:translate-y-0.5 transition-transform duration-200" />
              <span className="bg-gradient-to-r from-[#BF76FF] to-[#7300FF] bg-clip-text text-transparent">
                Ver Mais
              </span>
            </button>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className={cn("border-white/10 rounded-3xl max-w-sm", isDark ? "bg-roxo-bg text-white" : "bg-white text-black")}>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription className="opacity-60">
              Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1">Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
