import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, Upload, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface CreatePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle?: string;
  frameUrl?: string;
}

export default function CreatePhotoModal({ isOpen, onClose, eventTitle, frameUrl }: CreatePhotoModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use provided frameUrl or fallback to generated placeholder
  const FRAME_PLACEHOLDER = frameUrl || "data:image/svg+xml;utf8,<svg width='1080' height='1080' xmlns='http://www.w3.org/2000/svg'><rect width='1080' height='1080' fill='none' stroke='black' stroke-width='40'/><text x='540' y='100' font-family='sans-serif' font-size='60' text-anchor='middle' font-weight='bold' fill='black'>EU VOU!</text></svg>";

  useEffect(() => {
    if (!isOpen) {
      setSelectedImage(null);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setSelectedImage(event.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    if (!selectedImage || !canvasRef.current) return;
    
    setGenerating(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Target size for high res download
    canvas.width = 1080;
    canvas.height = 1080;

    // Load user image
    const img = new Image();
    img.src = selectedImage;
    
    await new Promise((resolve) => {
      img.onload = () => {
        // Background color
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate drawing dimensions
        const baseScale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const finalScale = baseScale * scale;
        
        const drawWidth = img.width * finalScale;
        const drawHeight = img.height * finalScale;
        
        // The display container is a square. We map the position offsets 
        // to our 1080x1080 canvas based on some approximation since the preview 
        // box might be differently sized. Let's assume preview is ~300x300.
        const previewSize = 300; 
        const ratio = canvas.width / previewSize;
        
        const dx = (canvas.width / 2) - (drawWidth / 2) + (position.x * ratio);
        const dy = (canvas.height / 2) - (drawHeight / 2) + (position.y * ratio);

        ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

        // Load Frame
        const frame = new Image();
        frame.src = FRAME_PLACEHOLDER;
        
        frame.onload = () => {
          ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
          
          // Trigger Download
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `meu-ingresso-${Date.now()}.jpg`;
          link.click();
          
          setGenerating(false);
          onClose();
          
          // Success Feedback
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#BF76FF', '#EC4899', '#ffffff']
          });
        };
      };
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-xl font-black uppercase tracking-tight text-black">Criar Minha Foto</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="rounded-full hover:bg-gray-100 text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6">
              {!selectedImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#BF76FF] bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors group"
                >
                  <div className="w-16 h-16 rounded-full bg-[#BF76FF]/10 text-[#BF76FF] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-black font-bold uppercase text-sm tracking-widest text-center">Selecionar Foto</p>
                  <p className="text-gray-500 text-xs mt-2 text-center max-w-[200px]">Clique para enviar uma foto do seu dispositivo</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  {/* Editor Container */}
                  <div className="text-center w-full">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Arraste para ajustar</p>
                    
                    <div className="relative w-[300px] h-[300px] mx-auto bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                      {/* Interaction Layer */}
                      <div 
                        className="absolute inset-0 z-20 cursor-move"
                        onMouseDown={startDrag}
                        onMouseMove={handleDrag}
                        onMouseUp={stopDrag}
                        onMouseLeave={stopDrag}
                        onTouchStart={startDrag}
                        onTouchMove={handleDrag}
                        onTouchEnd={stopDrag}
                      />
                      
                      {/* Image Layer */}
                      <div 
                        className="absolute top-1/2 left-1/2"
                        style={{
                          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`
                        }}
                      >
                        <img 
                          src={selectedImage} 
                          alt="Preview" 
                          className="max-w-none pointer-events-none"
                          style={{
                            height: '300px', // base size
                            width: 'auto'
                          }}
                        />
                      </div>
                      
                      {/* Frame Layer */}
                      <img 
                        src={FRAME_PLACEHOLDER} 
                        className="absolute inset-0 w-full h-full z-10 pointer-events-none" 
                        alt="Moldura" 
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="w-full">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 text-center">Ajustar Zoom</p>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.5" 
                      step="0.01" 
                      value={scale} 
                      onChange={(e) => setScale(parseFloat(e.target.value))}
                      className="w-full accent-[#BF76FF]"
                    />
                  </div>

                  <div className="flex gap-3 w-full">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedImage(null)}
                      className="flex-1 rounded-xl h-12 uppercase tracking-widest text-[10px] font-black border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
                    >
                      Trocar
                    </Button>
                    <Button 
                      onClick={handleDownload}
                      disabled={generating}
                      className="flex-1 rounded-xl h-12 bg-gradient-to-r from-[#BF76FF] to-pink-500 hover:opacity-90 text-white uppercase tracking-widest text-[10px] font-black shadow-lg shadow-purple-500/30 cursor-pointer"
                    >
                      {generating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Baixar Imagem
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
            />
          </motion.div>
        </motion.div>
      )}
      
      {/* Hidden canvas for high-res generation */}
      <canvas ref={canvasRef} className="hidden" />
    </AnimatePresence>
  );
}
