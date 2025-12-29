/**
 * Fetch with caching utility
 * Implements cache-first strategy for offline support with real-time sync
 */

import { supabase } from '@/integrations/supabase/client';
import { getCache, setCache } from './offlineStorage';
import { toast } from 'sonner';

interface FetchOptions {
  cacheKey: string;
  ttl?: number; // Time to live in ms (default: 1 hour)
  skipCache?: boolean;
  realtime?: boolean; // Enable real-time updates
}

/**
 * Fetch data with caching strategy:
 * 1. Return cache if available
 * 2. Fetch from Supabase
 * 3. Update cache
 * 4. Return fresh data
 */
export async function fetchWithCache<T>(
  supabaseQuery: any, // PostgrestFilterBuilder
  options: FetchOptions
): Promise<T | null> {
  const { cacheKey, ttl = 3600000, skipCache = false } = options;

  // Try cache first
  if (!skipCache) {
    try {
      const cached = await getCache<T>(cacheKey);
      if (cached) {
        // Fetch fresh data in background but return cache immediately
        supabaseQuery
          .then(async (res: any) => {
            if (res.error) throw res.error;
            if (res.data) {
              await setCache(cacheKey, res.data as T, ttl);
            }
          })
          .catch((error: any) => {
            console.warn(`Failed to refresh ${cacheKey} from server:`, error);
          });

        return cached;
      }
    } catch (error) {
      console.warn(`Failed to read cache for ${cacheKey}:`, error);
    }
  }

  // Fetch from server
  try {
    const res = await supabaseQuery;
    if (res.error) throw res.error;

    if (res.data) {
      // Save to cache
      await setCache(cacheKey, res.data as T, ttl);
      return res.data as T;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching ${cacheKey}:`, error);
    
    // If fetch fails and we're offline, try cache as fallback
    try {
      const cached = await getCache<T>(cacheKey);
      if (cached) {
        toast.warning(`Using cached data for ${cacheKey}`);
        return cached;
      }
    } catch (cacheError) {
      console.error(`Cache fallback failed for ${cacheKey}:`, cacheError);
    }

    throw error;
  }
}

/**
 * Setup real-time subscription to a table
 */
export function subscribeToTable<T extends { id: string }>(
  tableName: string,
  onUpdate: (data: T) => void,
  onInsert: (data: T) => void,
  onDelete: (data: T) => void,
  filter?: string
): () => void {
  let subscription: any = null;

  const setupSubscription = () => {
    const channel = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName,
          filter,
        },
        (payload) => onUpdate(payload.new as T)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter,
        },
        (payload) => onInsert(payload.new as T)
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: tableName,
          filter,
        },
        (payload) => onDelete(payload.old as T)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✓ Real-time subscription active for ${tableName}`);
        } else if (status === 'CLOSED') {
          console.log(`✗ Real-time subscription closed for ${tableName}`);
          // Retry after 5 seconds
          setTimeout(setupSubscription, 5000);
        }
      });

    subscription = channel;
  };

  setupSubscription();

  // Return unsubscribe function
  return () => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  };
}

/**
 * Setup multiple real-time subscriptions easily
 */
export function subscribeToMultipleTables(
  subscriptions: Array<{
    tableName: string;
    onUpdate?: (data: any) => void;
    onInsert?: (data: any) => void;
    onDelete?: (data: any) => void;
    filter?: string;
  }>
): () => void {
  const unsubscribers = subscriptions.map((sub) =>
    subscribeToTable(
      sub.tableName,
      sub.onUpdate || (() => {}),
      sub.onInsert || (() => {}),
      sub.onDelete || (() => {}),
      sub.filter
    )
  );

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
