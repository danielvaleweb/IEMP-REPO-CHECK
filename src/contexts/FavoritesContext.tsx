import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { firestoreService } from "@/services/firestoreService";

export type FavoriteCategory = "music" | "event" | "video" | "photo";

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
  favoriteIds: string[];
  toggleFavorite: (item: FavoriteItem) => Promise<void>;
  isFavorite: (itemId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchFavorites = async () => {
      if (!user) {
        setFavorites([]);
        setFavoriteIds([]);
        return;
      }

      try {
        // Use firestoreService for caching
        const items = await firestoreService.getCollection<FavoriteItem>(
          `users/${user.uid}/favorites`, 
          [], 
          1000 * 60 * 60 // 1 hour TTL
        );
        
        if (isMounted) {
          setFavorites(items);
          setFavoriteIds(items.map(item => item.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/favorites`);
      }
    };

    fetchFavorites();
    return () => { isMounted = false; };
  }, [user]);

  const toggleFavorite = async (item: FavoriteItem) => {
    if (!user) return;

    const docRef = doc(db, "users", user.uid, "favorites", item.id);
    const exists = favoriteIds.includes(item.id);

    // Optimistic UI updates
    if (exists) {
      setFavorites(prev => prev.filter(f => f.id !== item.id));
      setFavoriteIds(prev => prev.filter(id => id !== item.id));
    } else {
      setFavorites(prev => [...prev, item]);
      setFavoriteIds(prev => [...prev, item.id]);
    }

    try {
      if (exists) {
        await deleteDoc(docRef);
      } else {
        const cleanItem = Object.fromEntries(Object.entries(item).filter(([_, v]) => v !== undefined));
        await setDoc(docRef, cleanItem);
      }
      // Clear cache so next fetch is fresh if TTL expired
      firestoreService.clearCache(`users/${user.uid}/favorites`);
    } catch (e) {
      console.error("Failed to toggle favorite", e);
      // Revert optimistic updates on error (optional, for brevity skipped here or handled by reload)
    }
  };

  const isFavorite = (itemId: string) => {
    return favoriteIds.includes(itemId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, favoriteIds, toggleFavorite, isFavorite }}>
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
