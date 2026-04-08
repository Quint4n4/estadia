import { useState, useEffect } from 'react';

export type NetworkStatus = 'online' | 'offline' | 'syncing';

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(
    navigator.onLine ? 'online' : 'offline'
  );

  useEffect(() => {
    const goOnline  = () => setStatus('online');
    const goOffline = () => setStatus('offline');
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return {
    status,
    isOnline:  status === 'online',
    isOffline: status === 'offline',
    isSyncing: status === 'syncing',
  };
}
