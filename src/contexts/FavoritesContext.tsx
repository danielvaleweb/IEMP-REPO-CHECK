import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type FavoriteCategory = "music" | "event" | "video";

export interface FavoriteItem {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
  link: string;
  category: FavoriteCategory;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (itemId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

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

  const toggleFavorite = (item: FavoriteItem) => {
    setFavorites(prev => {
      const isFav = prev.some(v => v.id === item.id);
      let newFavs;
      if (isFav) {
        newFavs = prev.filter(v => v.id !== item.id);
      } else {
        newFavs = [...prev, item];
      }
      localStorage.setItem("church_favorites", JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const isFavorite = (itemId: string) => {
    return favorites.some(v => v.id === itemId);
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
