import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  link: string;
}

interface FavoritesContextType {
  favorites: Video[];
  toggleFavorite: (video: Video) => void;
  isFavorite: (videoId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Video[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("church_favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  const toggleFavorite = (video: Video) => {
    setFavorites(prev => {
      const isFav = prev.some(v => v.id === video.id);
      let newFavs;
      if (isFav) {
        newFavs = prev.filter(v => v.id !== video.id);
      } else {
        newFavs = [...prev, video];
      }
      localStorage.setItem("church_favorites", JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const isFavorite = (videoId: string) => {
    return favorites.some(v => v.id === videoId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
