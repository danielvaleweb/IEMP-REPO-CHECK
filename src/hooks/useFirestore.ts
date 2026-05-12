import { useState, useEffect, useCallback } from "react";
import { firestoreService } from "@/services/firestoreService";
import { QueryConstraint } from "firebase/firestore";

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
