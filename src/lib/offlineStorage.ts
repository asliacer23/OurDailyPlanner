/**
 * Offline Storage Service
 * Handles caching of data to IndexedDB for offline access
 * Automatically syncs when back online
 */

const DB_NAME = 'DailyPlannerDB';
const DB_VERSION = 1;

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Create cache store
      if (!database.objectStoreNames.contains('cache')) {
        const cacheStore = database.createObjectStore('cache', { keyPath: 'key' });
        cacheStore.createIndex('timestamp', 'timestamp');
      }

      // Create sync queue store
      if (!database.objectStoreNames.contains('syncQueue')) {
        database.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Save data to cache
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttl?: number
): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
    };

    const request = store.put(entry);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get data from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cache'], 'readonly');
    const store = transaction.objectStore('cache');
    
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const entry = request.result as CacheEntry<T> | undefined;
      
      if (!entry) {
        resolve(null);
        return;
      }

      // Check if expired
      if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
        // Delete expired entry
        deleteCache(key).catch(console.error);
        resolve(null);
        return;
      }

      resolve(entry.data);
    };
  });
}

/**
 * Delete from cache
 */
export async function deleteCache(key: string): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Add change to sync queue (for offline editing)
 */
export interface QueuedChange {
  id?: number;
  contentType: string;
  contentId: string;
  action: 'create' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: number;
  synced: boolean;
}

export async function addToSyncQueue(
  contentType: string,
  contentId: string,
  action: 'create' | 'update' | 'delete',
  data: Record<string, any>
): Promise<number> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    const change: QueuedChange = {
      contentType,
      contentId,
      action,
      data,
      timestamp: Date.now(),
      synced: false,
    };

    const request = store.add(change);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as number);
  });
}

/**
 * Get all pending changes
 */
export async function getPendingChanges(): Promise<QueuedChange[]> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve((request.result as QueuedChange[]).filter(c => !c.synced));
    };
  });
}

/**
 * Mark change as synced
 */
export async function markAsSynced(id: number): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const change = getRequest.result as QueuedChange;
      change.synced = true;
      
      const putRequest = store.put(change);
      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Clear sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  const database = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
