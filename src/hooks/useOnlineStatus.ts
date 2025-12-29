import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook to detect online/offline status
 * Automatically triggers sync on reconnection
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    // Check initial status
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setWasOffline(true);
    toast.success('Back online! Syncing data...');
    
    // Dispatch custom event for global sync
    window.dispatchEvent(new Event('reconnected'));
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    toast.warning('You are offline. Changes will sync when back online.');
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline };
}

/**
 * Hook to listen for reconnection events
 */
export function useOnReconnect(callback: () => Promise<void> | void) {
  useEffect(() => {
    const handleReconnect = async () => {
      try {
        await callback();
      } catch (error) {
        console.error('Error during reconnect sync:', error);
      }
    };

    window.addEventListener('reconnected', handleReconnect);
    
    return () => {
      window.removeEventListener('reconnected', handleReconnect);
    };
  }, [callback]);
}
