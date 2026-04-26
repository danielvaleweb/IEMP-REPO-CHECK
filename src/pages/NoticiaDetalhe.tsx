import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  Share2, 
  ChevronLeft, 
  Clock, 
  Facebook, 
  Instagram,
  Twitter, 
  MessageCircle, 
  Eye,
  TrendingUp,
  ArrowRight,
  Play,
  X,
  ExternalLink,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Markdown from "react-markdown";

declare global {
  interface Window {
    instgrm: any;
  }
}

export default function NoticiaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [christianNews, setChristianNews] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      try {
        const docRef = doc(db, "blog", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const postData: any = { id: docSnap.id, ...docSnap.data() };
          setPost(postData);

          // Get related posts (same organization or category)
          const qRelated = query(
            collection(db, "blog"), 
            where("organization", "==", postData.organization || "Blog"),
            limit(4)
          );
          const relatedSnap = await getDocs(qRelated);
          setRelatedPosts(relatedSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => p.id !== id)
          );
        } else {
          console.error("Notícia não encontrada");
        }

        // Load latest Christian news (general blog news)
        const qLatest = query(collection(db, "blog"), orderBy("createdAt", "desc"), limit(4));
        const latestSnap = await getDocs(qLatest);
        setChristianNews(latestSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Load sidebar recent news
        const qRecent = query(collection(db, "blog"), orderBy("createdAt", "desc"), limit(10));
        const recentSnap = await getDocs(qRecent);
        setRecentPosts(recentSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.id !== id)
          .slice(0, 5)
        );

      } catch (error) {
        console.error("Erro ao carregar noticia:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    window.scrollTo(0, 0);
  }, [id]);

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    if (url.includes('youtube.com/shorts/')) {
      return url.replace('shorts/', 'embed/');
    }
    if (url.includes('instagram.com/')) {
      // Return raw URL to be handled by blockquote
      return url;
    }
    return url;
  };

  useEffect(() => {
    if (post?.videoUrl?.includes('instagram.com/')) {
      // Load Instagram embed script if it doesn't exist
      if (!window.instgrm) {
        const s = document.createElement('script');
        s.async = true;
        s.src = '//www.instagram.com/embed.js';
        document.body.appendChild(s);
      } else {
        // Trigger generic process
        window.instgrm.Embeds.process();
      }
    }
  }, [post?.videoUrl]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = post.title;
    
    switch(platform) {
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't have a direct share link, just copy URL
        navigator.clipboard.writeText(url);
        alert("Link copiado para o Instagram!");
        break;
      case 'native':
        if (navigator.share) {
          navigator.share({ title: text, url });
        } else {
          navigator.clipboard.writeText(url);
          alert("Link copiado!");
        }
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#BF76FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-black mb-4">Notícia não encontrada</h1>
        <Button onClick={() => navigate("/")} className="bg-[#BF76FF] text-white">Voltar ao Início</Button>
      </div>
    );
  }

  const galleryImages = post.gallery ? post.gallery.split('\n').filter((url: string) => url.trim() !== '') : [];

  return (
    <div className="min-h-screen bg-white text-black font-['Inter',_sans-serif] selection:bg-[#BF76FF] selection:text-white">
      {/* Photo Lightbox */}
      <AnimatePresence>
        {activeImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setActiveImage(null)}
          >
            <button className="absolute top-8 right-8 text-white hover:text-[#BF76FF] transition-colors">
              <X className="w-8 h-8" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={activeImage} 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8 pb-24 pt-12 md:pt-16">
        {/* Article Header (Jornalístico) Full Width */}
        <div className="flex flex-col gap-6 text-left items-start text-black mb-10 w-full">
          <div className="flex items-center gap-2">
            <span className="text-[#c4170c] font-black text-sm uppercase tracking-widest">{post.organization || "Blog"}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span className="text-gray-500 text-xs font-semibold uppercase">{post.category || "Notícia"}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] text-[#111] max-w-5xl">
            {post.title}
          </h1>

          {post.subtitle && (
            <p className="text-xl md:text-2xl text-gray-500 font-medium leading-[1.2] max-w-4xl border-l-4 border-gray-200 pl-6 mt-2">
              {post.subtitle}
            </p>
          )}

          <div className="flex flex-col w-full md:flex-row md:items-end justify-between border-y border-gray-100 py-6 gap-8 mt-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.source || "Ministério Profecia")}&background=BF76FF&color=fff`} className="w-full h-full object-cover" alt="Author" />
              </div>
              <div className="flex flex-col text-left mr-8">
                <span className="text-sm font-bold text-gray-900">Fonte: {post.source || "Ministério Profecia"}</span>
                <span className="text-xs text-gray-500 font-medium">
                  {post.date || new Date().toLocaleDateString('pt-BR')} {post.createdAt?.seconds ? `— Atualizado em ${new Date(post.createdAt.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </span>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleShare('facebook')}
                className="h-10 px-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-sm group"
              >
                <Facebook className="w-4 h-4 text-[#1877F2] fill-current" />
                <span className="text-xs font-bold text-[#1877F2]">Facebook</span>
              </button>
              <button 
                onClick={() => handleShare('whatsapp')}
                className="h-10 px-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors shadow-sm group"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366] fill-current" />
                <span className="text-xs font-bold text-[#25D366]">WhatsApp</span>
              </button>
              <button 
                onClick={() => handleShare('native')}
                className="h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-sm group"
              >
                <Share2 className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-bold text-gray-600">Compartilhar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {/* Main Photo with Caption */}
          <div className="flex flex-col gap-3">
             <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group cursor-pointer" onClick={() => setActiveImage(post.image)}>
              <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
            </div>
            {(post.imageCaption || post.source) && (
              <p className="text-xs text-gray-400 font-medium px-2 flex items-center gap-2">
                <Info className="w-3 h-3 text-[#BF76FF]" />
                {post.imageCaption || `Imagem: ${post.source || "Arquivo Ministério Profecia"}`}
              </p>
            )}
          </div>

          {/* Article Text */}
          <article className="prose prose-lg max-w-none prose-img:rounded-xl prose-headings:font-black prose-headings:tracking-tighter prose-p:text-gray-800 prose-p:leading-relaxed text-xl leading-relaxed text-gray-800">
            <div className="markdown-body">
              <Markdown>{post.content}</Markdown>
            </div>
          </article>

          {/* Video Section */}
          {post.videoUrl && (
            <div className="flex flex-col gap-4 mt-8">
              <div className="flex items-center gap-3">
                <Play className="w-5 h-5 text-[#BF76FF] fill-current" />
                <h3 className="text-xl font-black uppercase tracking-tighter">Vídeo relacionado</h3>
              </div>
              <div className={`w-full rounded-3xl overflow-hidden shadow-xl bg-black border border-gray-100 ${post.videoUrl.includes('instagram.com') ? 'max-w-[400px] mx-auto bg-transparent border-none shadow-none' : 'aspect-video'}`}>
                {post.videoUrl.includes('instagram.com') ? (
                  <>
                    <blockquote 
                      className="instagram-media w-full mb-0" 
                      data-instgrm-permalink={`${post.videoUrl.split('?')[0]}?utm_source=ig_embed&amp;utm_campaign=loading`}
                      data-instgrm-version="14"
                      style={{ background: '#FFF', border: '0', borderRadius: '3px', boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)', margin: '1px', maxWidth: '540px', minWidth: '326px', padding: '0', width: 'calc(100% - 2px)' }}
                    >
                    </blockquote>
                  </>
                ) : (
                  <iframe 
                    src={getEmbedUrl(post.videoUrl) || ""} 
                    className="w-full h-full border-none"
                    allowFullScreen
                    title="Video Player"
                    scrolling="no"
                  />
                )}
              </div>
            </div>
          )}

          {/* Photo Gallery Area */}
          {galleryImages.length > 0 && (
            <div className="flex flex-col gap-6 mt-8">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-[#BF76FF]" />
                <h3 className="text-xl font-black uppercase tracking-tighter">Fotos enviadas</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {galleryImages.map((img: string, idx: number) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ y: -5 }}
                    className="aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-md group"
                    onClick={() => setActiveImage(img)}
                  >
                    <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={`Galeria ${idx}`} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Christian News Topics */}
          <div className="mt-16 pt-16 border-t border-gray-100">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#c4170c] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                Últimas notícias do mundo cristão
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {christianNews.map((news) => (
                <Link key={news.id} to={`/noticia/${news.id}`} className="group flex flex-col gap-4">
                  <div className="aspect-video rounded-3xl overflow-hidden shadow-lg">
                    <img src={news.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={news.title} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-black leading-tight group-hover:text-[#BF76FF] transition-colors">{news.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{news.subtitle || news.content?.substring(0, 80) + '...'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Related Articles Topics */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-16 border-t border-gray-100">
              <h2 className="text-2xl font-black mb-10 uppercase tracking-tighter text-[#111]">Matérias recomendadas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {relatedPosts.map((rel) => (
                  <Link key={rel.id} to={`/noticia/${rel.id}`} className="group flex flex-col gap-4">
                    <div className="aspect-video rounded-3xl overflow-hidden shadow-lg">
                      <img src={rel.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={rel.title} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-black leading-tight group-hover:text-[#BF76FF] transition-colors">{rel.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{rel.subtitle || rel.content?.substring(0, 80) + '...'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between py-12 border-t border-gray-100">
            <Button 
              variant="outline" 
              className="h-14 px-8 rounded-2xl gap-2 border-gray-200 text-gray-500 font-bold uppercase tracking-widest text-xs hover:border-[#BF76FF] hover:text-[#BF76FF] transition-all"
              onClick={() => navigate("/")}
            >
              <ChevronLeft className="w-4 h-4" /> Voltar ao site
            </Button>
            <div className="flex items-center gap-3 text-gray-400 text-sm font-bold bg-gray-50 px-6 py-3 rounded-2xl">
              <Eye className="w-4 h-4 text-[#BF76FF]" /> {Math.floor(Math.random() * 5000) + 1000} leitores
            </div>
          </div>
        </div>

        {/* Sidebar (G1 Style) */}
        <aside className="lg:col-span-4 space-y-12">
          <div className="bg-white border border-gray-100 rounded-[40px] p-8 sticky top-32 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-6 h-6 text-[#c4170c]" />
              <h2 className="text-xl font-black uppercase tracking-tighter">Mais lidas</h2>
            </div>

            <div className="flex flex-col gap-8">
              {recentPosts.map((rPost, idx) => (
                <Link 
                  key={rPost.id} 
                  to={`/noticia/${rPost.id}`}
                  className="group flex gap-4 items-start"
                >
                  <div className="text-4xl font-black text-gray-100 group-hover:text-[#BF76FF] transition-colors leading-none pt-1 w-10 text-right">
                    {idx + 1}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-black text-gray-900 group-hover:text-[#c4170c] transition-colors leading-tight line-clamp-3 uppercase tracking-tighter">
                      {rPost.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> {rPost.date || "Hoje"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <hr className="my-8 border-gray-100" />

            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-4">
                Siga a IEMP no instagram
              </p>
              <Button 
                onClick={() => window.open('https://www.instagram.com/ministerio_profecia/', '_blank')}
                className="w-full h-14 rounded-2xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white font-bold gap-2 hover:opacity-90 transition-opacity"
              >
                <Instagram className="w-5 h-5" /> @ministerio_profecia
              </Button>
            </div>
          </div>
          
          <div className="aspect-[3/4] w-full bg-black rounded-[40px] flex flex-col items-center justify-center text-center p-8 gap-6 border border-white/10 group overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
             <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
             <div className="relative z-20 flex flex-col items-center w-full">
              <span className="text-[10px] font-black text-[#BF76FF] uppercase tracking-widest mb-4 bg-[#BF76FF]/20 px-3 py-1 rounded-full">Anúncio</span>
              <div className="w-20 h-20 rounded-3xl bg-white shadow-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-500">
                <Play className="w-10 h-10 text-[#c4170c] fill-current translate-x-1" />
              </div>
              <h4 className="text-3xl text-white font-black leading-tight mb-2 uppercase tracking-tighter">@IEMPTV</h4>
              <p className="text-sm text-gray-300 mb-6 font-medium">Siga nosso canal e acompanhe mensagens que edificam sua vida.</p>
              <Button onClick={() => window.open('https://www.youtube.com/@ministerio_profecia', '_blank')} className="w-full h-12 rounded-xl bg-[#c4170c] hover:bg-[#a0130a] text-white font-bold gap-2 shadow-lg">
                <Play className="w-4 h-4 fill-current" /> Inscrever-se
              </Button>
             </div>
          </div>
        </aside>
      </div>
    </div>
    </div>
  );
}