import { useState, useEffect, useCallback } from "react";
import { firestoreService } from "@/services/firestoreService";
import { 
  QueryConstraint, 
  onSnapshot, 
  collection, 
  doc, 
  query 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Hook to fetch a collection with caching
 */
export function useCachedCollection<T>(
  collectionName: string, 
  constraints: QueryConstraint[] = [], 
  ttl?: number
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (forceRefresh) {
        firestoreService.clearCache(collectionName);
      }
      const result = await firestoreService.getCollection<T>(collectionName, constraints, ttl);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [collectionName, JSON.stringify(constraints.map(c => JSON.stringify(c))), ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: () => fetchData(true) };
}

/**
 * Hook to fetch a single document with caching
 */
export function useCachedDoc<T>(
  collectionName: string, 
  docId: string | undefined, 
  ttl?: number
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!docId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      if (forceRefresh) {
        firestoreService.clearCache(collectionName);
      }
      const result = await firestoreService.getDoc<T>(collectionName, docId, ttl);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [collectionName, docId, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: () => fetchData(true) };
}

/**
 * Hook to fetch a document in REAL-TIME
 */
export function useFirestoreRealtimeDoc<T>(
  collectionName: string,
  docId: string | undefined
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, docId);
    const unsubscribe = onSnapshot(docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const profileData = { id: snapshot.id, ...snapshot.data() } as T;
          setData(profileData);
          
          // Also update cache if it exists to keep everything in sync
          const cacheKey = `fs_cache_${collectionName}_${docId}`;
          localStorage.setItem(cacheKey, JSON.stringify({
            data: profileData,
            timestamp: Date.now(),
            ttl: 1000 * 60 * 60 * 24 // 24h
          }));
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, docId]);

  return { data, loading, error };
}

/**
 * Hook to fetch a collection in REAL-TIME
 */
export function useFirestoreRealtimeCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const result = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        setData(result);
        
        // Update cache
        const constraintsHash = constraints.map(c => JSON.stringify(c)).join('_');
        const cacheKey = `fs_cache_${collectionName}_${constraintsHash}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          data: result,
          timestamp: Date.now(),
          ttl: 1000 * 60 * 60 * 24 // 24h
        }));
        
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(constraints.map(c => JSON.stringify(c)))]);

  return { data, loading, error };
}

/**
 * Hook to fetch a collection only when needed (Lazy)
 */
export function useFirestoreLazy<T>() {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchLazy = useCallback(async (
    collectionName: string, 
    constraints: QueryConstraint[] = [], 
    ttl?: number
  ) => {
    try {
      setLoading(true);
      const result = await firestoreService.getCollection<T>(collectionName, constraints, ttl);
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetch: fetchLazy };
}
