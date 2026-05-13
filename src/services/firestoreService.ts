import {
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  QueryConstraint,
  limit,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const CACHE_PREFIX = "fs_cache_";
const DEFAULT_TTL = 1000 * 60 * 5; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-flight requests map to prevent duplicate calls
const inFlightRequests = new Map<string, Promise<any>>();

export const firestoreService = {
  /**
   * Get multiple documents from a collection with caching and request deduplication
   */
  async getCollection<T>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
    ttl: number = DEFAULT_TTL
  ): Promise<T[]> {
    const constraintsHash = constraints.map(c => JSON.stringify(c)).join('_');
    const cacheKey = `${CACHE_PREFIX}${collectionName}_${constraintsHash}`;

    // 1. Check in-memory in-flight requests (Deduplication)
    if (inFlightRequests.has(cacheKey)) {
      console.log(`[FirestoreService] Deduplicating request for ${collectionName}`);
      console.log(`FETCH-DB: GET-COLLECTION CACHED2: ${collectionName}`);
      return inFlightRequests.get(cacheKey);
    }

    // 2. Check persistent cache (localStorage)
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const item: CacheItem<T[]> = JSON.parse(cached);
      if (Date.now() - item.timestamp < item.ttl) {
        console.log(`[FirestoreService] Serving ${collectionName} from persistent cache`);
        console.log(`FETCH-DB: GET-COLLECTION CACHED: ${collectionName}`);
        return item.data;
      }
    }

    // 3. Fetch from Firestore
    const requestPromise = (async () => {
      console.log(`FETCH-DB: GET-COLLECTION REQUEST ${collectionName}`);
      try {
        console.log(`[FirestoreService] Fetching ${collectionName} from Firestore...`);
        const q = query(collection(db, collectionName), ...constraints);
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];

        // Save to cache
        const cacheItem: CacheItem<T[]> = {
          data,
          timestamp: Date.now(),
          ttl
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));

        return data;
      } catch (error: any) {
        console.error(`[FirestoreService] Error fetching ${collectionName}:`, error);

        // If quota exceeded or other error, return cached data even if expired as fallback
        if (cached) {
          console.warn(`[FirestoreService] Returning expired cache for ${collectionName} due to error`);
          const item: CacheItem<T[]> = JSON.parse(cached);
          return item.data;
        }
        throw error;
      } finally {
        // Remove from in-flight requests once finished
        inFlightRequests.delete(cacheKey);
      }
    })();

    inFlightRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  /**
   * Get a single document with caching and request deduplication
   */
  async getDoc<T>(
    collectionName: string,
    docId: string,
    ttl: number = DEFAULT_TTL
  ): Promise<T | null> {
    const cacheKey = `${CACHE_PREFIX}${collectionName}_${docId}`;

    if (inFlightRequests.has(cacheKey)) {
      console.log(`[FirestoreService] Deduplicating request for ${collectionName}/${docId}`);
      console.log(`FETCH-DB: GET-DOC CACHED2: ${collectionName}/${docId}`);
      return inFlightRequests.get(cacheKey);
    }

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const item: CacheItem<T> = JSON.parse(cached);
      if (Date.now() - item.timestamp < item.ttl) {
        console.log(`[FirestoreService] Serving ${collectionName}/${docId} from persistent cache`);
        console.log(`FETCH-DB: GET-DOC CACHED ${collectionName}/${docId}`);
        return item.data;
      }
    }

    const requestPromise = (async () => {
      console.log(`FETCH-DB: GET-DOC REQUEST ${collectionName}/${docId}`);
      try {

        console.log(`[FirestoreService] Fetching ${collectionName}/${docId} from Firestore...`);
        const docRef = doc(db, collectionName, docId);
        const snap = await getDoc(docRef);

        if (!snap.exists()) return null;

        const data = { id: snap.id, ...snap.data() } as T;

        const cacheItem: CacheItem<T> = {
          data,
          timestamp: Date.now(),
          ttl
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));

        return data;
      } catch (error: any) {
        console.error(`[FirestoreService] Error fetching ${collectionName}/${docId}:`, error);
        if (cached) {
          const item: CacheItem<T> = JSON.parse(cached);
          return item.data;
        }
        throw error;
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();

    inFlightRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  /**
   * Get the count of documents in a collection or query
   */
  async getCount(
    collectionObj: any,
    constraints: QueryConstraint[] = [],
    ttl: number = DEFAULT_TTL
  ): Promise<number> {
    const collName = collectionObj.path || 'unknown_coll';
    const constraintsHash = constraints.map(c => JSON.stringify(c)).join('_');
    const cacheKey = `${CACHE_PREFIX}count_${collName}_${constraintsHash}`;

    // 1. Check in-memory in-flight requests
    if (inFlightRequests.has(cacheKey)) {
      console.log(`FETCH-DB: GET-COUNT CACHED2 ${constraints}`);
      return inFlightRequests.get(cacheKey);
    }

    // 2. Check persistent cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const item: CacheItem<number> = JSON.parse(cached);
      if (Date.now() - item.timestamp < item.ttl) {
        console.log(`FETCH-DB: GET-COUNT CACHED ${constraints}`);
        return item.data;
      }
    }

    // 3. Fetch from Firestore
    const { getCountFromServer } = await import("firebase/firestore");
    const requestPromise = (async () => {
      console.log(`FETCH-DB: GET-COUNT REQUEST ${constraints}`);
      try {
        const q = query(collectionObj, ...constraints);
        const snapshot = await getCountFromServer(q);
        const count = snapshot.data().count;

        const cacheItem: CacheItem<number> = {
          data: count,
          timestamp: Date.now(),
          ttl
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));

        return count;
      } catch (error: any) {
        console.error(`[FirestoreService] Error fetching count for ${collName}:`, error);
        if (cached) {
          const item: CacheItem<number> = JSON.parse(cached);
          return item.data;
        }
        return 0;
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();

    inFlightRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  /**
   * Clear cache for a specific collection or all
   */
  clearCache(collectionName?: string) {
    console.log(`FETCH-DB: CLEAR-CACHE ${collectionName}`);
    if (collectionName) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${CACHE_PREFIX}${collectionName}`)) {
          localStorage.removeItem(key);
        }
      });
    } else {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  }
};
