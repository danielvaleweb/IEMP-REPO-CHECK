import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";

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
    if (!user) {
      setFavorites([]);
      setFavoriteIds([]);
      return;
    }

    const unsub = onSnapshot(collection(db, "users", user.uid, "favorites"), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as FavoriteItem);
      setFavorites(items);
      setFavoriteIds(items.map(item => item.id));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/favorites`));

    return () => unsub();
  }, [user]);

  const toggleFavorite = async (item: FavoriteItem) => {
    if (!user) return;

    const docRef = doc(db, "users", user.uid, "favorites", item.id);
    const exists = favoriteIds.includes(item.id);

    try {
      if (exists) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, item);
      }
    } catch (e) {
      console.error("Failed to toggle favorite", e);
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
