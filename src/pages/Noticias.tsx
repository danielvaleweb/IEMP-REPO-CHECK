import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getImageUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import { Play, Instagram, Clock, TrendingUp, Star, Video, MessageCircle, ChevronRight, Share2, Facebook, DollarSign, ArrowUpRight, ArrowDownRight, Calculator, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Noticias() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<any>(null);
  const [selic, setSelic] = useState<string>("---");
  const navigate = useNavigate();

  // Calculator states
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcInitial, setCalcInitial] = useState("1000");
  const [calcMonthly, setCalcMonthly] = useState("200");
  const [calcRate, setCalcRate] = useState("1");
  const [calcMonths, setCalcMonths] = useState("12");
  const [calcResult, setCalcResult] = useState<{ total: number, invested: number, interest: number } | null>(null);

  function calculateInterest() {
    const p = parseFloat(calcInitial) || 0;
    const m = parseFloat(calcMonthly) || 0;
    const r = (parseFloat(calcRate) || 0) / 100;
    const t = parseInt(calcMonths) || 0;

    let total = p;
    let invested = p;
    for (let i = 0; i < t; i++) {
      invested += m;
      total = total * (1 + r) + m;
    }
    setCalcResult({ total, invested, interest: total - invested });
  }

  useEffect(() => {
    async function fetchPosts() {
      try {
        const q = query(collection(db, "blog"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Erro ao buscar noticias", e);
      } finally {
        setLoading(false);
      }
    }

    async function fetchRates() {
      try {
        const CACHE_KEY = "profecia_finance_rates_v2";
        const CACHE_TIME_KEY = "profecia_finance_rates_time_v2";
        const now = new Date().getTime();
        
        const cachedDataStr = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

        // Se tem cache e não passou 24h (86400000 ms)
        if (cachedDataStr && cachedTime && (now - parseInt(cachedTime) < 86400000)) {
          const cachedData = JSON.parse(cachedDataStr);
          setRates(cachedData.rates);
          setSelic(cachedData.selic);
          return;
        }

        const [resRates, resSelic] = await Promise.all([
          fetch("https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL").then(r => r.json()),
          fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json").then(r => r.json())
        ]);
        
        const selicValue = resSelic[0]?.valor || "---";
        const dataToCache = { rates: resRates, selic: selicValue };
        
        localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());
        
        setRates(resRates);
        setSelic(selicValue);
      } catch (error) {
        console.error("Erro ao buscar cotações", error);
      }
    }

    fetchPosts();
    fetchRates();
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#c4170c] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#c4170c] font-black uppercase tracking-widest text-xs">Carregando Portal...</span>
      </div>
    );
  }

  const manchete = posts[0];
  const destaques = posts.slice(1, 4);
  const ultimasNoticias = posts.slice(4);
  const postsComVideo = posts.filter(p => p.videoUrl && !p.videoUrl.includes('instagram.com'));
  const postsInstagram = posts.filter(p => p.videoUrl && p.videoUrl.includes('instagram.com'));
  
  // Extrair autores únicos (top 5)
  const autores = [...new Set(posts.map(p => p.source || "Ministério Profecia"))].slice(0, 5);

  const getRelativeTime = (dateStr?: string, timestamp?: any) => {
    if (timestamp?.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      const now = new Date();
      const diffHrs = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffHrs < 1) return "agora";
      if (diffHrs < 24) return `há ${diffHrs}h`;
      return `há ${Math.floor(diffHrs / 24)}d`;
    }
    return dateStr || "Recente";
  };

  return (
    <div className="min-h-screen bg-white text-black font-['Inter',_sans-serif] selection:bg-[#c4170c] selection:text-white">
      {/* Header do Portal */}
      <div className="w-full bg-[#0a0a0a] border-b-[4px] border-[#c4170c]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
              Profecia<span className="text-[#c4170c]">.news</span>
            </h1>
            <div className="hidden md:flex h-6 w-px bg-white/20 mx-2" />
            <span className="hidden md:block text-xs font-bold text-white/50 uppercase tracking-widest">
              O Portal de Notícias do Reino
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="hidden md:flex rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white gap-2 bg-transparent font-bold">
               Ao Vivo <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </Button>
            <div className="text-white/80 text-xs font-bold tracking-widest uppercase text-right">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </div>

      {/* Navegação de Categorias Secundária */}
      <div className="w-full bg-gray-50 border-b border-gray-200 sticky top-0 z-40 shadow-sm overflow-x-auto scrollbar-hide">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-12 flex items-center gap-8 min-w-max">
          {['Recentes', 'Vídeos', 'Igreja', 'Eventos', 'Colunistas', 'Finanças'].map(cat => (
             <a key={cat} href={`#${cat.toLowerCase()}`} className="text-xs font-black uppercase tracking-widest text-gray-600 hover:text-[#c4170c] transition-colors py-3 border-b-2 border-transparent hover:border-[#c4170c]">
               {cat}
             </a>
          ))}
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Bloco Superior: Manchete + Mosaico */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          
          {/* Manchete Principal */}
          {manchete && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-8 group cursor-pointer"
              onClick={() => navigate(`/noticia/${manchete.id}`)}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-[#c4170c] text-white text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest">
                  {manchete.category || 'Destaque'}
                </span>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {getRelativeTime(manchete.date, manchete.createdAt)}
                </span>
              </div>
              <div className="relative aspect-[16/9] md:aspect-[2/1] rounded-3xl overflow-hidden mb-6 shadow-2xl">
                <img 
                  src={getImageUrl(manchete.image)} 
                  alt={manchete.title} 
                  className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {manchete.videoUrl && (
                  <div className="absolute bottom-6 left-6 w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Play className="w-6 h-6 text-white fill-current translate-x-0.5" />
                  </div>
                )}
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] text-[#111] group-hover:text-[#c4170c] transition-colors mb-4">
                {manchete.title}
              </h2>
              {manchete.subtitle && (
                <p className="text-xl md:text-2xl text-gray-500 font-medium leading-snug line-clamp-2">
                  {manchete.subtitle}
                </p>
              )}
            </motion.div>
          )}

          {/* Destaques Laterais (Mosaico) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {destaques.map((post, idx) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer flex flex-col gap-3 pb-6 border-b border-gray-100 last:border-0"
                onClick={() => navigate(`/noticia/${post.id}`)}
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-2 shadow-lg">
                  <img src={getImageUrl(post.image)} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  {post.videoUrl && (
                    <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <Play className="w-3 h-3 text-white fill-current translate-x-px" />
                    </div>
                  )}
                  {post.videoUrl?.includes('instagram.com') && (
                    <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                      <Instagram className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#c4170c] text-[10px] font-black uppercase tracking-widest">{post.category || 'Notícia'}</span>
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">• {getRelativeTime(post.date, post.createdAt)}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black tracking-tighter leading-tight group-hover:text-[#c4170c] transition-colors">
                  {post.title}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-12 border-t-[3px] border-gray-900" id="últimas">
          {/* Feed de Últimas Notícias */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-[#c4170c]" />
              <h2 className="text-3xl font-black uppercase tracking-tighter">Últimas Atualizações</h2>
            </div>
            
            <div className="flex flex-col gap-10">
              {ultimasNoticias.map((post) => (
                <div 
                  key={post.id} 
                  className="group cursor-pointer grid grid-cols-1 md:grid-cols-3 gap-6 items-start pb-10 border-b border-gray-200"
                  onClick={() => navigate(`/noticia/${post.id}`)}
                >
                  <div className="md:col-span-1 relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md">
                    <img src={getImageUrl(post.image)} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="md:col-span-2 flex flex-col h-full justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[#c4170c] font-black text-[10px] uppercase tracking-widest bg-[#c4170c]/10 px-2 py-1 rounded-sm">
                        {post.organization || 'Geral'}
                      </span>
                      <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {getRelativeTime(post.date, post.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tighter leading-none group-hover:text-[#c4170c] transition-colors mb-3">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base font-medium line-clamp-2 leading-relaxed mb-4">
                      {post.subtitle || post.content?.substring(0, 120) + '...'}
                    </p>
                    <div className="flex items-center gap-4 mt-auto pt-4 border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-2">
                        Por <span className="text-black">{post.source || "Ministério Profecia"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebars Temáticas */}
          <div className="lg:col-span-4 flex flex-col gap-12">
            
            {/* Bloco de Vídeos (TV) */}
            {postsComVideo.length > 0 && (
              <div className="bg-black text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden" id="vídeos">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c4170c] rounded-full blur-[80px] opacity-40 -mr-10 -mt-10" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <Video className="w-6 h-6 text-[#c4170c]" />
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic">IEMP<span className="text-[#c4170c]">.tv</span></h3>
                    </div>
                  </div>
                  <div className="flex flex-col gap-6">
                    {postsComVideo.slice(0, 3).map(post => (
                      <div key={`video-${post.id}`} className="group cursor-pointer" onClick={() => navigate(`/noticia/${post.id}`)}>
                        <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden mb-3">
                          <img src={getImageUrl(post.image)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-[#c4170c] flex items-center justify-center shadow-[0_0_20px_rgba(196,23,12,0.5)] group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-current translate-x-0.5" />
                            </div>
                          </div>
                        </div>
                        <h4 className="font-bold text-sm leading-tight group-hover:text-[#c4170c] transition-colors">{post.title}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bloco de Instagram */}
            {postsInstagram.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-50 to-pink-50 border border-pink-100 p-8 rounded-[40px]" id="instagram">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-tr from-yellow-600 via-pink-600 to-purple-800">
                    Destaques no Insta
                  </h3>
                </div>
                <div className="flex flex-col gap-4">
                  {postsInstagram.slice(0, 3).map(post => (
                    <div key={`insta-${post.id}`} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(`/noticia/${post.id}`)}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
                           <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                             <img src={`https://ui-avatars.com/api/?name=${post.source}&background=random`} className="w-full h-full object-cover" />
                           </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold leading-none">{post.source || "IEMP"}</span>
                          <span className="text-[10px] text-gray-500 mt-0.5">Via Instagram</span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-gray-800 group-hover:text-pink-600 transition-colors leading-snug">{post.title}</h4>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl h-12 font-bold hover:opacity-90">
                  Siga nosso perfil
                </Button>
              </div>
            )}

            {/* Bloco de Colunistas / Autores */}
            <div className="bg-gray-50 border border-gray-200 p-8 rounded-[40px]" id="colunistas">
              <div className="flex items-center gap-3 mb-8">
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <h3 className="text-xl font-black uppercase tracking-tighter">Quem Postou</h3>
              </div>
              <div className="flex flex-col gap-6">
                {autores.map((autor, idx) => (
                  <div key={idx} className="flex items-center justify-between group cursor-pointer" onClick={() => {}}>
                    <div className="flex items-center gap-4">
                      <img src={`https://ui-avatars.com/api/?name=${autor}&background=BF76FF&color=fff&rounded=true`} className="w-12 h-12 rounded-full border-2 border-white shadow-sm group-hover:border-[#BF76FF] transition-colors" />
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#c4170c] transition-colors">{autor}</h4>
                        <p className="text-xs text-gray-500 font-medium">{posts.filter(p => p.source === autor).length} publicações</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#c4170c] group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Seção de Finanças */}
        <div className="mt-20 pt-16 border-t-[4px] border-[#c4170c]" id="finanças">
          <div className="flex items-center gap-3 mb-10">
            <DollarSign className="w-8 h-8 text-[#c4170c]" />
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Finanças & Mercado</h2>
          </div>

          {/* Ticker / Cotações */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {rates?.USDBRL && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Dólar Comercial</span>
                <span className="text-2xl font-black text-gray-900">R$ {parseFloat(rates.USDBRL.bid).toFixed(2)}</span>
                <span className={`text-xs font-bold flex items-center gap-1 ${parseFloat(rates.USDBRL.pctChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {parseFloat(rates.USDBRL.pctChange) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {rates.USDBRL.pctChange}%
                </span>
              </div>
            )}
            {rates?.EURBRL && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Euro</span>
                <span className="text-2xl font-black text-gray-900">R$ {parseFloat(rates.EURBRL.bid).toFixed(2)}</span>
                <span className={`text-xs font-bold flex items-center gap-1 ${parseFloat(rates.EURBRL.pctChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {parseFloat(rates.EURBRL.pctChange) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {rates.EURBRL.pctChange}%
                </span>
              </div>
            )}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Taxa Selic</span>
              <span className="text-2xl font-black text-gray-900">{selic !== "---" ? `${parseFloat(selic).toLocaleString('pt-BR')}%` : "---"}</span>
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1">Ao ano</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">CDI Mensal</span>
              <span className="text-2xl font-black text-gray-900">0,83%</span>
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1">Acumulado</span>
            </div>
            <div 
              onClick={() => { setCalcOpen(true); calculateInterest(); }}
              className="bg-black p-4 rounded-2xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#c4170c]/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <Calculator className="w-6 h-6 text-[#c4170c] mb-2 relative z-10" />
              <span className="text-[10px] font-black uppercase text-white tracking-widest relative z-10">Calculadora</span>
              <span className="text-xs text-gray-400 font-medium relative z-10">De Rendimentos</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Onde Investir */}
            <div className="flex flex-col gap-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Onde Investir Hoje?</h3>
              <div className="flex flex-col gap-4">
                <div className="border border-gray-200 rounded-2xl p-6 hover:border-[#c4170c] transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-black text-gray-900 group-hover:text-[#c4170c] transition-colors">CDB Renda Fixa</h4>
                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Baixo Risco</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 font-medium">Os Certificados de Depósito Bancário (CDBs) que pagam 110% a 120% do CDI estão entre as melhores opções de liquidez diária com a Selic atual.</p>
                  <Button variant="link" className="p-0 h-auto text-[#c4170c] font-bold text-xs uppercase tracking-widest gap-1 group-hover:gap-2 transition-all">
                    Entenda como funciona <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-2xl p-6 hover:border-[#c4170c] transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-black text-gray-900 group-hover:text-[#c4170c] transition-colors">Tesouro Direto</h4>
                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Garantido pelo FGC</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 font-medium">Com a Selic em dois dígitos, o Tesouro Selic continua sendo o porto seguro do investidor brasileiro para reservas de emergência.</p>
                  <Button variant="link" className="p-0 h-auto text-[#c4170c] font-bold text-xs uppercase tracking-widest gap-1 group-hover:gap-2 transition-all">
                    Veja os títulos disponíveis <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Vídeos de Investimento */}
            <div className="flex flex-col gap-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Aprenda a Investir</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer shadow-md bg-gray-100">
                  <iframe 
                    src="https://www.youtube.com/embed/M7lc1UVf-VE" 
                    title="Onde investir" 
                    className="w-full h-full border-none pointer-events-auto"
                    allowFullScreen
                  />
                </div>
                <div className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer shadow-md bg-gray-100">
                  <iframe 
                    src="https://www.youtube.com/embed/aqz-KE-bpKQ" 
                    title="CDB e CDI" 
                    className="w-full h-full border-none pointer-events-auto"
                    allowFullScreen
                  />
                </div>
                <div className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer shadow-md bg-gray-100">
                  <iframe 
                    src="https://www.youtube.com/embed/jNQXAC9IVRw" 
                    title="Reserva de Emergência" 
                    className="w-full h-full border-none pointer-events-auto"
                    allowFullScreen
                  />
                </div>
                <div className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer shadow-md bg-[#111] flex flex-col items-center justify-center border border-gray-800 hover:bg-[#c4170c] transition-colors">
                  <Play className="w-8 h-8 text-white mb-2" />
                  <span className="text-white font-black text-xs uppercase tracking-widest">Ver Mais Vídeos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Calculadora */}
        {calcOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg relative shadow-2xl"
            >
              <button 
                onClick={() => setCalcOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#c4170c]/10 p-3 rounded-xl">
                  <Calculator className="w-6 h-6 text-[#c4170c]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900">Juros Compostos</h3>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Simule seus rendimentos</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-xs font-black text-gray-600 uppercase tracking-widest block mb-2">Valor Inicial (R$)</label>
                  <input 
                    type="number" 
                    value={calcInitial} 
                    onChange={e => setCalcInitial(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:border-[#c4170c] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-600 uppercase tracking-widest block mb-2">Aporte Mensal (R$)</label>
                  <input 
                    type="number" 
                    value={calcMonthly} 
                    onChange={e => setCalcMonthly(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:border-[#c4170c] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-600 uppercase tracking-widest block mb-2">Taxa Mensal (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={calcRate} 
                    onChange={e => setCalcRate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:border-[#c4170c] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-600 uppercase tracking-widest block mb-2">Período (Meses)</label>
                  <input 
                    type="number" 
                    value={calcMonths} 
                    onChange={e => setCalcMonths(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:border-[#c4170c] transition-colors"
                  />
                </div>
              </div>

              <Button 
                onClick={calculateInterest}
                className="w-full bg-[#c4170c] hover:bg-[#a0130a] text-white font-black uppercase tracking-widest py-6 rounded-xl mb-6 text-sm"
              >
                Calcular Rendimento
              </Button>

              {calcResult && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="text-center mb-6">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Valor Total Final</span>
                    <span className="text-4xl font-black text-green-600">R$ {calcResult.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                    <div className="text-center w-1/2 border-r border-gray-200">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Total Investido</span>
                      <span className="text-lg font-bold text-gray-900">R$ {calcResult.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="text-center w-1/2">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Total em Juros</span>
                      <span className="text-lg font-bold text-green-600">+ R$ {calcResult.interest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

      </main>
    </div>
  );
}
