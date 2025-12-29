import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Wifi, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 text-success text-xs font-medium">
        <Wifi className="h-3 w-3" />
        Online
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-xs font-medium animate-pulse">
      <WifiOff className="h-3 w-3" />
      Offline Mode
    </div>
  );
}

/**
 * Sync status indicator for when data is being synced
 */
interface SyncStatusProps {
  isSyncing?: boolean;
  pendingCount?: number;
}

export function SyncStatus({ isSyncing = false, pendingCount = 0 }: SyncStatusProps) {
  if (pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
        isSyncing
          ? 'bg-primary/10 text-primary'
          : 'bg-warning/10 text-warning'
      )}
    >
      <Loader className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
      {isSyncing ? 'Syncing...' : `${pendingCount} pending`}
    </div>
  );
}
