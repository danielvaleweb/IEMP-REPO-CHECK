import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Video, 
  Play, 
  Search,
  ExternalLink,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
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
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    thumbnail: ""
  });

  useEffect(() => {
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setVideos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "videos"));

    return () => unsubscribe();
  }, []);

  const handleAddVideo = async () => {
    if (!formData.title || !formData.url) return;
    
    try {
      await addDoc(collection(db, "videos"), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setFormData({ title: "", url: "", thumbnail: "" });
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "videos");
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este vídeo?")) return;
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-black")}>Gerenciamento de Vídeos</h2>
          <p className="text-sm text-gray-500">Adicione vídeos manualmente para a galeria do site.</p>
        </div>
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-gradient-to-r from-[#7300FF] to-[#CC7EFF] text-white rounded-2xl h-12 px-6 font-bold"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Vídeo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input 
          placeholder="Pesquisar vídeos..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn("h-12 pl-12 rounded-2xl border-none", isDark ? "bg-white/5 text-white" : "bg-gray-100 text-black")}
        />
      </div>

      {isAdding && (
        <Card className={cn("p-6 rounded-[32px] border-none shadow-2xl", isDark ? "bg-[#111]" : "bg-white")}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Cadastrar Novo Vídeo</h3>
            <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/5 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Título do Vídeo</label>
              <Input 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Mensagem de Domingo - Fé inabalável"
                className={cn("h-12 rounded-2xl border-none", isDark ? "bg-white/5" : "bg-gray-50")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">URL do YouTube</label>
              <Input 
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="https://www.youtube.com/watch?v=..."
                className={cn("h-12 rounded-2xl border-none", isDark ? "bg-white/5" : "bg-gray-50")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Thumbnail Personalizada (Opcional)</label>
              <Input 
                value={formData.thumbnail}
                onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                placeholder="Deixe vazio para usar a do YouTube"
                className={cn("h-12 rounded-2xl border-none", isDark ? "bg-white/5" : "bg-gray-50")}
              />
            </div>
            <Button 
              onClick={handleAddVideo}
              className="w-full bg-[#BF76FF] text-white h-12 rounded-2xl font-bold mt-4"
            >
              <Save className="w-4 h-4 mr-2" /> Salvar Vídeo
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => {
          const ytId = getYoutubeId(video.url);
          const thumb = video.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : "");
          
          return (
            <Card key={video.id} className={cn("group overflow-hidden rounded-[32px] border-none shadow-xl transition-all hover:scale-[1.02]", isDark ? "bg-[#111]" : "bg-white")}>
              <div className="aspect-video relative overflow-hidden">
                <img src={thumb} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-12 h-12 text-white fill-current" />
                </div>
              </div>
              <div className="p-6">
                <h4 className="font-bold text-sm line-clamp-2 mb-4 h-10">{video.title}</h4>
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => window.open(video.url, "_blank")}
                    className="text-[#BF76FF] hover:bg-[#BF76FF]/10 rounded-xl"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteVideo(video.id)}
                    className="text-red-500 hover:bg-red-500/10 rounded-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredVideos.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center">
            <Video className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-20" />
            <p className="text-gray-500">Nenhum vídeo cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
