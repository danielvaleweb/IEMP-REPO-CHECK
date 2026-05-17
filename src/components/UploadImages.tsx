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
      const isValidSize = file.size <= 3 * 1024 * 1024; // 3MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== fileList.length) {
      setError('Alguns arquivos foram ignorados (apenas JPG, PNG, WEBP até 3MB)');
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
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        disabled={uploading}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Sleek Button to trigger Upload (Only show if multiple or if no preview yet in single mode) */}
      {(!previews.length || multiple) && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "h-14 w-full md:w-auto px-6 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[11px] tracking-widest border transition-all cursor-pointer shadow-sm active:scale-[0.98]",
            uploading 
              ? "bg-[#BF76FF]/10 border-[#BF76FF]/20 text-[#BF76FF]/50 cursor-not-allowed" 
              : "bg-black/[0.04] border-black/10 text-black hover:bg-black/[0.06] hover:border-[#BF76FF]/50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10 dark:hover:border-[#BF76FF]/50 hover:shadow-[0_0_15px_rgba(191,118,255,0.15)]"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#BF76FF]" />
              <span>Enviando Imagem...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-[#BF76FF]" />
              <span>Enviar Imagem (3MB Máx)</span>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {previews.length > 0 && (
        <div className={cn("grid gap-4 mt-2", multiple ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : "grid-cols-1")}>
          {previews.map((item, index) => (
            <div key={index} className={cn("p-4 rounded-3xl border flex flex-col gap-3 relative overflow-hidden transition-all bg-black/[0.02] border-black/5 dark:bg-white/[0.02] dark:border-white/5")}>
              <div className="flex gap-4 items-center">
                {/* Image Thumbnail */}
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/40 flex-shrink-0 group">
                  <img src={getImageUrl(item.url)} alt="Thumbnail" className="w-full h-full object-cover" />
                  
                  {/* Status Overlay */}
                  {item.status === 'compressing' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin text-[#BF76FF]" />
                    </div>
                  )}
                  {item.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin text-[#BF76FF]" />
                      <span className="text-[8px] font-black">{Math.round(item.progress)}%</span>
                    </div>
                  )}
                </div>

                {/* Info & Options */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 truncate">
                    {item.file ? item.file.name : "Imagem Configurada"}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    {item.file ? `${(item.file.size / 1024 / 1024).toFixed(2)} MB` : "Link Externo"}
                  </p>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => downloadImage(item.url)}
                      className="text-[9px] font-black uppercase tracking-widest text-[#BF76FF] hover:underline cursor-pointer"
                    >
                      Baixar
                    </button>
                    <span className="text-gray-400 dark:text-gray-600 text-[9px]">•</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual URL Link Input */}
              <div className="space-y-1 mt-1">
                <div className="flex items-center gap-1.5 px-1">
                  <LinkIcon className="w-3 h-3 text-[#BF76FF]" />
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Link da Imagem</label>
                </div>
                <Input 
                  value={item.url}
                  onChange={(e) => handleManualUrlChange(index, e.target.value)}
                  className="h-10 text-[11px] rounded-xl bg-black/[0.04] dark:bg-black/20 border-black/5 dark:border-white/5 focus:border-[#BF76FF]/40 focus:bg-white/5 transition-all text-gray-800 dark:text-white font-mono"
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

