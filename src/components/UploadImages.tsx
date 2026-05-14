import React, { useState, useCallback, useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ImageIcon, 
  Trash2, 
  Pencil, 
  Download, 
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import { Progress } from './ui/progress';
import { cn, getImageUrl } from '../lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

interface UploadImagesProps {
  onUploadComplete: (results: CloudinaryResponse[]) => void;
  onRemove?: (url: string) => void;
  maxFiles?: number;
  label?: string;
  className?: string;
  multiple?: boolean;
  value?: string | string[];
}

const CLOUD_NAME = 'dvkgodvhm';
const UPLOAD_PRESET = 'site_uploads';

export const UploadImages: React.FC<UploadImagesProps> = ({
  onUploadComplete,
  onRemove,
  maxFiles = 5,
  label = 'Upload de Imagens',
  className,
  multiple = true,
  value
}) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<{ file?: File; url: string; progress: number; status: 'idle' | 'compressing' | 'uploading' | 'done' | 'error' | 'existing' }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showOptions, setShowOptions] = useState<number | null>(null);

  // Initialize previews from value
  useEffect(() => {
    if (value) {
      const urls = Array.isArray(value) ? value : [value];
      const existingPreviews = urls.filter(u => !!u).map(url => ({
        url,
        progress: 100,
        status: 'existing' as const
      }));
      setPreviews(existingPreviews);
    } else {
      setPreviews([]);
    }
  }, [value]);

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: file.type === 'image/png' && file.size > 2 * 1024 * 1024 ? 'image/jpeg' : file.type
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Erro na compressão:', error);
      return file;
    }
  };

  const uploadToCloudinary = async (file: File, onProgress: (p: number) => void): Promise<CloudinaryResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
            width: response.width,
            height: response.height
          });
        } else {
          reject(new Error('Falha no upload'));
        }
      };

      xhr.onerror = () => reject(new Error('Erro de conexão'));
      xhr.send(formData);
    });
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    
    // Validations
    const validFiles = fileList.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== fileList.length) {
      setError('Alguns arquivos foram ignorados (apenas JPG, PNG, WEBP até 10MB)');
    } else {
      setError(null);
    }

    if (validFiles.length === 0) return;

    const newPreviews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      progress: 0,
      status: 'idle' as const
    }));

    setPreviews(prev => multiple ? [...prev, ...newPreviews] : newPreviews);
    
    setUploading(true);
    const results: CloudinaryResponse[] = [];

    for (let i = 0; i < newPreviews.length; i++) {
      const item = newPreviews[i];
      
      try {
        setPreviews(prev => prev.map(p => p.file === item.file ? { ...p, status: 'compressing' } : p));
        const compressedFile = await compressImage(item.file!);
        
        setPreviews(prev => prev.map(p => p.file === item.file ? { ...p, status: 'uploading' } : p));
        
        const result = await uploadToCloudinary(compressedFile as File, (progress) => {
          setPreviews(prev => prev.map(p => p.file === item.file ? { ...p, progress } : p));
        });

        results.push(result);
        setPreviews(prev => prev.map(p => p.file === item.file ? { ...p, status: 'done', progress: 100 } : p));
      } catch (err) {
        console.error(err);
        setPreviews(prev => prev.map(p => p.file === item.file ? { ...p, status: 'error' } : p));
      }
    }

    setUploading(false);
    if (results.length > 0) {
      onUploadComplete(results);
    }
  }, [multiple, onUploadComplete]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const url = previews[index].url;
    if (onRemove) onRemove(url);
    
    setPreviews(prev => {
      const newPrev = [...prev];
      if (newPrev[index].file) URL.revokeObjectURL(newPrev[index].url);
      newPrev.splice(index, 1);
      return newPrev;
    });
    
    // If it's a single file, clear parent state
    if (!multiple) {
      onUploadComplete([]);
    }
  };

  const downloadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `imagem-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const handleManualUrlChange = (index: number, newUrl: string) => {
    setPreviews(prev => prev.map((p, i) => i === index ? { ...p, url: newUrl, status: 'existing' } : p));
    if (!multiple) {
      onUploadComplete([{ secure_url: newUrl, public_id: '', width: 0, height: 0 }]);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5",
          uploading ? "opacity-50 pointer-events-none" : "border-gray-300 dark:border-gray-700",
          previews.length > 0 && !multiple && "hidden" // Esconde dropzone se já tiver uma imagem em modo single
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="bg-blue-500/10 p-4 rounded-full mb-4">
          <Upload className="w-8 h-8 text-blue-500" />
        </div>
        <p className="font-bold text-center">{label}</p>
        <p className="text-xs text-gray-500 text-center mt-1">
          Arraste e solte ou clique para selecionar<br />
          JPG, PNG, WEBP até 10MB
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {previews.length > 0 && (
        <div className={cn("grid gap-6", multiple ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : "grid-cols-1")}>
          {previews.map((item, index) => (
            <div key={index} className="space-y-3">
              <div className="relative group aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-lg">
                <img src={getImageUrl(item.url)} alt="Preview" className="w-full h-full object-cover" />
                
                {/* Overlay with Pencil Icon - ALWAYS VISIBLE */}
                <div 
                  className={cn(
                    "absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity cursor-pointer opacity-100",
                    showOptions === index && "bg-black/60"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(showOptions === index ? null : index);
                  }}
                >
                  <div className="bg-white/90 backdrop-blur-md p-3 rounded-full border border-white shadow-xl text-blue-600 hover:scale-110 active:scale-95 transition-all">
                    <Pencil className="w-5 h-5" />
                  </div>
                </div>

                {/* Status Overlays */}
                {item.status === 'compressing' && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-xs uppercase font-black tracking-widest">Comprimindo...</span>
                  </div>
                )}
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white px-8">
                    <Progress value={item.progress} className="h-1.5 mb-2 w-full" />
                    <span className="text-xs uppercase font-black tracking-widest">Enviando {Math.round(item.progress)}%</span>
                  </div>
                )}

                {/* Options Menu */}
                {showOptions === index && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 z-20">
                    <div className="grid grid-cols-2 gap-3 w-full max-w-[200px]">
                      <button 
                        onClick={() => { setShowOptions(null); fileInputRef.current?.click(); }}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                      >
                        <RefreshCw className="w-5 h-5 text-blue-400" />
                        <span className="text-[10px] font-bold uppercase">Trocar</span>
                      </button>
                      <button 
                        onClick={() => { setShowOptions(null); downloadImage(item.url); }}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
                      >
                        <Download className="w-5 h-5 text-blue-400" />
                        <span className="text-[10px] font-bold uppercase">Baixar</span>
                      </button>
                      <button 
                        onClick={() => { setShowOptions(null); removeFile(index); }}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-red-500/20 hover:bg-red-500/40 transition-colors text-red-500 col-span-2"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase">Remover</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => setShowOptions(null)}
                      className="mt-4 p-2 text-white/40 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Manual URL Input */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-2">
                  <LinkIcon className="w-3 h-3 text-blue-500" />
                  <label className="text-[9px] font-black uppercase tracking-widest text-blue-500">Link da Imagem</label>
                </div>
                <Input 
                  value={item.url}
                  onChange={(e) => handleManualUrlChange(index, e.target.value)}
                  className="h-10 text-[11px] rounded-xl bg-black/5 border-blue-500/20 focus:border-blue-500/50 focus:bg-white/5 transition-all text-blue-600 dark:text-blue-400 font-medium"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

