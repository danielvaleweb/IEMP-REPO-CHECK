import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(idOrUrl: string | undefined | null) {
  if (!idOrUrl) return "";
  
  // Handle direct Google Drive URLs
  if (idOrUrl.includes("drive.google.com")) {
    if (idOrUrl.includes("thumbnail")) {
      return idOrUrl; // Keep thumbnail URLs as they are to bypass Vercel bandwidth limits
    }
    // Try to match the /d/ID pattern
    const matchD = idOrUrl.match(/d\/([^/]+)/);
    if (matchD && matchD[1]) {
      return `https://lh3.googleusercontent.com/d/${matchD[1]}`;
    }
    // Try to match the id=ID pattern
    const matchId = idOrUrl.match(/[?&]id=([^&]+)/);
    if (matchId && matchId[1]) {
      return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
    }
  }

  // ✨ Auto-optimize Cloudinary URLs: inject q_auto/f_auto for WebP + quality compression
  if (idOrUrl.includes("res.cloudinary.com") && idOrUrl.includes("/upload/")) {
    // Avoid double-injecting if already optimized
    if (!idOrUrl.includes("q_auto") && !idOrUrl.includes("f_auto")) {
      return idOrUrl.replace("/upload/", "/upload/q_auto/f_auto/");
    }
    return idOrUrl;
  }

  if (idOrUrl.startsWith("http") || idOrUrl.startsWith("data:") || idOrUrl.startsWith("blob:") || idOrUrl.startsWith("/")) {
    return idOrUrl;
  }
  
  // If it's a 33-character Google Drive ID or similar
  if (idOrUrl.length >= 25 && !idOrUrl.includes(" ")) {
     return `https://lh3.googleusercontent.com/d/${idOrUrl}`;
  }

  return idOrUrl;
}

export function getRelativeTime(date: Date | string | number | any) {
  if (!date) return "agora";
  let d: Date;
  if (date?.toDate) d = date.toDate();
  else if (date instanceof Date) d = date;
  else d = new Date(date);

  if (isNaN(d.getTime())) return "agora";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 5) return "agora";
  if (diffInSeconds < 60) return `há ${diffInSeconds} segundos`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `há ${diffInMonths} mê${diffInMonths > 1 ? 'ses' : 's'}`;
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `há ${diffInYears} ano${diffInYears > 1 ? 's' : ''}`;
}
