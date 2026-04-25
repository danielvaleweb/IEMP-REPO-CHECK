import { useState } from "react";
import { Camera, Image as ImageIcon, Calendar, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const ALBUMS = [
  {
    id: "1",
    title: "Congresso de Jovens 2026",
    date: "Março 2026",
    cover: "https://picsum.photos/seed/youth/800/600",
    photos: [
      "https://picsum.photos/seed/y1/1200/800",
      "https://picsum.photos/seed/y2/1200/800",
      "https://picsum.photos/seed/y3/1200/800",
      "https://picsum.photos/seed/y4/1200/800",
      "https://picsum.photos/seed/y5/1200/800",
      "https://picsum.photos/seed/y6/1200/800",
    ]
  },
  {
    id: "2",
    title: "Batismo nas Águas",
    date: "Fevereiro 2026",
    cover: "https://picsum.photos/seed/baptism/800/600",
    photos: [
      "https://picsum.photos/seed/b1/1200/800",
      "https://picsum.photos/seed/b2/1200/800",
      "https://picsum.photos/seed/b3/1200/800",
    ]
  },
  {
    id: "3",
    title: "Aniversário da Igreja",
    date: "Janeiro 2026",
    cover: "https://picsum.photos/seed/anniversary/800/600",
    photos: [
      "https://picsum.photos/seed/a1/1200/800",
      "https://picsum.photos/seed/a2/1200/800",
    ]
  }
];

export default function Gallery() {
  const [selectedAlbum, setSelectedAlbum] = useState<typeof ALBUMS[0] | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div className="pt-24 pb-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 gradient-text">Nossa Galeria</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Momentos especiais registrados em nossa caminhada. Cada foto conta uma história 
            do que Deus tem feito em nosso meio.
          </p>
        </div>

        {!selectedAlbum ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {ALBUMS.map((album) => (
              <motion.div
                key={album.id}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
                onClick={() => setSelectedAlbum(album)}
              >
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-black/5">
                  <img 
                    src={album.cover} 
                    alt={album.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">{album.date}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                      {album.title}
                    </h3>
                    <div className="mt-4 flex items-center gap-2 text-white/80 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                      Ver álbum <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedAlbum(null)}
                className="text-muted-foreground hover:text-primary"
              >
                ← Voltar para álbuns
              </Button>
              <div className="text-right">
                <h2 className="text-3xl font-bold">{selectedAlbum.title}</h2>
                <p className="text-primary font-bold uppercase tracking-widest text-xs">{selectedAlbum.date}</p>
              </div>
            </div>

            {/* Full width header photo for the event as requested */}
            <div className="w-full h-[40vh] md:h-[60vh] rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
              <img 
                src={selectedAlbum.cover} 
                alt={selectedAlbum.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedAlbum.photos.map((photo, idx) => (
                <motion.div
                  key={`photo-${selectedAlbum.id}-${idx}`}
                  whileHover={{ scale: 1.02 }}
                  className="aspect-square rounded-2xl overflow-hidden cursor-pointer border border-white/5"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img 
                    src={photo} 
                    alt={`Foto ${idx + 1}`} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12 cursor-pointer"
            onClick={() => setSelectedPhoto(null)}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-6 right-6 text-white hover:bg-white/10 rounded-full"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="w-8 h-8" />
            </Button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedPhoto}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
