import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { getImageUrl } from "@/lib/utils";

interface CreatePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle?: string;
  frameUrl?: string;
}

export default function CreatePhotoModal({ isOpen, onClose, eventTitle, frameUrl }: CreatePhotoModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, ratio: 1 });
  const [frameDimensions, setFrameDimensions] = useState({ width: 1080, height: 1080, ratio: 1 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rawFrame = frameUrl || "";
  const actualFrameUrl = useMemo(() => {
    if (!rawFrame) {
      return "data:image/svg+xml;utf8,<svg width='1080' height='1080' xmlns='http://www.w3.org/2000/svg'><rect width='1080' height='1080' fill='none' stroke='black' stroke-width='40'/><text x='540' y='100' font-family='sans-serif' font-size='60' text-anchor='middle' font-weight='bold' fill='black'>EU VOU!</text></svg>";
    }
    return getImageUrl(rawFrame);
  }, [rawFrame]);

  const isDataURL = (s: string) => s?.startsWith('data:') || false;

  // Load Frame Dimensions whenever modal opens or frameUrl changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedImage(null);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      return;
    }

    const frameImg = new Image();
    if (!isDataURL(actualFrameUrl)) {
      frameImg.crossOrigin = "anonymous";
    }
    frameImg.onload = () => {
      const w = frameImg.naturalWidth || 1080;
      const h = frameImg.naturalHeight || 1080;
      setFrameDimensions({
        width: w,
        height: h,
        ratio: w / h
      });
    };
    frameImg.onerror = () => {
      setFrameDimensions({ width: 1080, height: 1080, ratio: 1 });
    };
    frameImg.src = actualFrameUrl;
  }, [isOpen, actualFrameUrl]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setImageDimensions({
            width: img.width,
            height: img.height,
            ratio: img.width / img.height
          });
          setSelectedImage(result);
          setScale(1);
          setPosition({ x: 0, y: 0 });
        };
        img.src = result;
      };
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

  // Calculate preview container dimensions according to frame ratio
  const maxPreviewHeight = 360;
  const previewWidth = useMemo(() => {
    const calculatedWidth = maxPreviewHeight * frameDimensions.ratio;
    if (calculatedWidth > 300) {
      return 300;
    }
    return Math.max(calculatedWidth, 180);
  }, [frameDimensions.ratio]);

  const actualPreviewHeight = useMemo(() => {
    return previewWidth / frameDimensions.ratio;
  }, [previewWidth, frameDimensions.ratio]);

  // Calculate user image base sizing in preview container
  const userImageBaseDimensions = useMemo(() => {
    if (!imageDimensions.ratio) return { width: previewWidth, height: actualPreviewHeight };
    if (imageDimensions.ratio > frameDimensions.ratio) {
      const height = actualPreviewHeight;
      const width = height * imageDimensions.ratio;
      return { width, height };
    } else {
      const width = previewWidth;
      const height = width / imageDimensions.ratio;
      return { width, height };
    }
  }, [imageDimensions.ratio, frameDimensions.ratio, previewWidth, actualPreviewHeight]);

  const handleDownload = async () => {
    if (!selectedImage || !canvasRef.current) return;
    
    setGenerating(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Use exact natural frame resolution (e.g. 1080x1920)
    canvas.width = frameDimensions.width;
    canvas.height = frameDimensions.height;

    // Load user image
    const img = new Image();
    if (!isDataURL(selectedImage)) {
      img.crossOrigin = "anonymous";
    }
    img.src = selectedImage;
    
    try {
      const result = await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const canvasToPreviewRatio = canvas.width / previewWidth;
            
            const baseDrawWidth = userImageBaseDimensions.width * canvasToPreviewRatio;
            const baseDrawHeight = userImageBaseDimensions.height * canvasToPreviewRatio;
            
            const drawWidth = baseDrawWidth * scale;
            const drawHeight = baseDrawHeight * scale;
            
            const dx = (canvas.width / 2) - (drawWidth / 2) + (position.x * canvasToPreviewRatio);
            const dy = (canvas.height / 2) - (drawHeight / 2) + (position.y * canvasToPreviewRatio);

            ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

            // Load Frame Image
            const frame = new Image();
            if (!isDataURL(actualFrameUrl)) {
              frame.crossOrigin = "anonymous";
            }
            
            const proxyFrameUrl = (!isDataURL(actualFrameUrl) && !actualFrameUrl.startsWith('data:image/svg'))
              ? `https://wsrv.nl/?url=${encodeURIComponent(actualFrameUrl)}`
              : actualFrameUrl;

            frame.src = proxyFrameUrl;
            
            frame.onload = () => {
              try {
                ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                resolve(dataUrl);
              } catch (err) {
                try {
                  const dataUrl = canvas.toDataURL('image/png');
                  resolve(dataUrl);
                } catch (e2) {
                  reject(err);
                }
              }
            };
            frame.onerror = () => {
              // Try loading without proxy as fallback
              const fallbackFrame = new Image();
              fallbackFrame.crossOrigin = "anonymous";
              fallbackFrame.onload = () => {
                try {
                  ctx.drawImage(fallbackFrame, 0, 0, canvas.width, canvas.height);
                  resolve(canvas.toDataURL('image/jpeg', 0.95));
                } catch (err2) {
                  reject(err2);
                }
              };
              fallbackFrame.onerror = (e) => reject(new Error("Erro ao carregar a imagem da moldura."));
              fallbackFrame.src = actualFrameUrl;
            };
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error("Erro ao carregar sua foto."));
      });

      if (result) {
        const link = document.createElement('a');
        link.href = result as string;
        link.download = `foto-${eventTitle ? eventTitle.replace(/\s+/g, '-').toLowerCase() : 'evento'}-${Date.now()}.jpg`;
        link.click();
        
        onClose();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#BF76FF', '#EC4899', '#ffffff']
        });
      }
    } catch (err: any) {
      console.error("Critical error in download:", err);
      alert(`Não foi possível gerar a imagem: ${err.message || "Erro de permissão na imagem da moldura."}`);
    } finally {
      setGenerating(false);
    }
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
            className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
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

            <div className="p-6 overflow-y-auto flex-1">
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
                  <div className="text-center w-full flex flex-col items-center">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Arraste para ajustar a foto</p>
                    
                    <div 
                      className="relative bg-gray-100 rounded-2xl overflow-hidden shrink-0 border border-gray-200 shadow-md"
                      style={{
                        width: `${previewWidth}px`,
                        height: `${actualPreviewHeight}px`
                      }}
                    >
                      {/* Interaction Layer */}
                      <div 
                        className="absolute inset-0 z-30 cursor-move"
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
                        className="absolute top-1/2 left-1/2 z-10"
                        style={{
                          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`
                        }}
                      >
                        <img 
                          src={selectedImage} 
                          alt="Preview" 
                          className="max-w-none pointer-events-none"
                          style={{
                            width: `${userImageBaseDimensions.width}px`,
                            height: `${userImageBaseDimensions.height}px`
                          }}
                        />
                      </div>
                      
                      {/* Frame Layer */}
                      <div className="absolute inset-0 z-20 pointer-events-none">
                        <img 
                          src={actualFrameUrl} 
                          className="w-full h-full object-contain" 
                          alt="Moldura" 
                        />
                      </div>
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
            {/* Hidden canvas for high-res generation */}
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
