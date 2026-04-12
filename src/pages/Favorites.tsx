import { motion } from "framer-motion";
import { Heart, X, Play, ArrowLeft } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Favorites() {
  const { favorites, toggleFavorite } = useFavorites();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-[#BF76FF] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#BF76FF]/20">
              <Heart className="w-8 h-8 fill-white" />
            </div>
            <div>
              <nav className="flex items-center gap-2 text-white/40 text-sm mb-2">
                <Link to="/" className="hover:text-white transition-colors">Início</Link>
                <span>/</span>
                <span className="text-white">Favoritos</span>
              </nav>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Meus Favoritos</h1>
            </div>
          </div>
          
          <div className="text-white/40 text-sm font-medium">
            {favorites.length} {favorites.length === 1 ? 'vídeo salvo' : 'vídeos salvos'}
          </div>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-32 text-center bg-white/5 rounded-[40px] border border-white/5"
          >
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8">
              <Heart className="w-12 h-12 text-white/10" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Sua pasta está vazia</h2>
            <p className="text-white/40 max-w-md mx-auto mb-10">
              Você ainda não favoritou nenhum vídeo. Explore nossa galeria e salve seus conteúdos preferidos para acessá-los rapidamente aqui.
            </p>
            <Link to="/galeria">
              <Button className="bg-white text-black hover:bg-white/90 rounded-full px-8 h-12 font-bold transition-all active:scale-95">
                Explorar Galeria
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((video, index) => (
              <motion.div 
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-[#1a1a1a] border border-white/5 rounded-[32px] overflow-hidden hover:border-[#BF76FF]/30 transition-all duration-500"
              >
                {/* Thumbnail Container */}
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={video.thumbnail} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={video.title} 
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-3">
                    <Button 
                      className="bg-white text-black hover:bg-white/90 rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-xl"
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
                    >
                      <Play className="w-5 h-5 fill-current ml-1" />
                    </Button>
                    <Button 
                      variant="ghost"
                      className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full w-12 h-12 p-0 flex items-center justify-center transition-all"
                      onClick={() => toggleFavorite(video)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white group-hover:text-[#BF76FF] transition-colors line-clamp-2 mb-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-white/40 font-medium uppercase tracking-widest">
                    <span>Vídeo</span>
                    <span>{new Date(video.published).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-16 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-[#BF76FF] transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
