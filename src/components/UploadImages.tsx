import React, { useState, useCallback, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, ImageIcon, Trash2 } from 'lucide-react';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

interface UploadImagesProps {
  onUploadComplete: (results: CloudinaryResponse[]) => void;
  maxFiles?: number;
  label?: string;
  className?: string;
  multiple?: boolean;
}

const CLOUD_NAME = 'dvkgodvhm';
const UPLOAD_PRESET = 'site_uploads';

export const UploadImages: React.FC<UploadImagesProps> = ({
  onUploadComplete,
  maxFiles = 5,
  label = 'Upload de Imagens',
  className,
  multiple = true
}) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string; progress: number; status: 'idle' | 'compressing' | 'uploading' | 'done' | 'error' }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    // Cloudinary automatically handles f_auto, q_auto if configured in preset, 
    // but we can't easily force it here without signed uploads or transformations on delivery.
    // The requirement says: "Cloudinary deve usar f_auto,q_auto automaticamente"
    // This is usually done on the URL retrieval side, but we can also add incoming transformations if the preset allows.

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
        // Update status to compressing
        setPreviews(prev => prev.map(p => p.file === item.file ? { ...p, status: 'compressing' } : p));
        const compressedFile = await compressImage(item.file);
        
        // Update status to uploading
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
    setPreviews(prev => {
      const newPrev = [...prev];
      URL.revokeObjectURL(newPrev[index].url);
      newPrev.splice(index, 1);
      return newPrev;
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5",
          uploading ? "opacity-50 pointer-events-none" : "border-gray-300 dark:border-gray-700"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((item, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
              <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {item.status === 'compressing' && (
                  <div className="flex flex-col items-center text-white">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    <span className="text-[10px] uppercase font-bold">Comprimindo...</span>
                  </div>
                )}
                {item.status === 'uploading' && (
                  <div className="w-full px-4 flex flex-col items-center text-white">
                    <Progress value={item.progress} className="h-1 mb-2" />
                    <span className="text-[10px] uppercase font-bold">Enviando {Math.round(item.progress)}%</span>
                  </div>
                )}
                {item.status === 'done' && (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                )}
                {item.status === 'error' && (
                  <AlertCircle className="w-8 h-8 text-red-500" />
                )}
                
                {!uploading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {item.status !== 'done' && item.status !== 'idle' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300" 
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
