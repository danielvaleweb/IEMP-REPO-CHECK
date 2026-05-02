import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(idOrUrl: string | undefined | null) {
  if (!idOrUrl) return "";
  
  if (idOrUrl.includes("drive.google.com")) {
    const match = idOrUrl.match(/d\/([^/]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }

  if (idOrUrl.startsWith("http") || idOrUrl.startsWith("data:") || idOrUrl.startsWith("blob:")) {
    return idOrUrl;
  }
  
  // If it's a 33-character Google Drive ID or similar
  return `https://lh3.googleusercontent.com/d/${idOrUrl}`;
}
