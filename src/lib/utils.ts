import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(idOrUrl: string | undefined | null) {
  if (!idOrUrl) return "";
  if (idOrUrl.startsWith("http") || idOrUrl.startsWith("data:") || idOrUrl.startsWith("blob:")) {
    return idOrUrl;
  }
  // If it's a 33-character Google Drive ID or similar
  return `https://lh3.googleusercontent.com/d/${idOrUrl}`;
}
