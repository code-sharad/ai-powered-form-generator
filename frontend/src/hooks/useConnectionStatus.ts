'use client';

import { useEffect, useState } from 'react';

type ConnectionStatus = 'online' | 'offline' | 'reconnected';

export function useConnectionStatus() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('online');

  useEffect(() => {
    function handleOnline() {
      setConnectionStatus(current => current === 'offline' ? 'reconnected' : current);
    }
    function handleOffline() {
      setConnectionStatus('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  function acknowledgeReconnect() {
    setConnectionStatus(current => current === 'reconnected' ? 'online' : current);
  }

  return { connectionStatus, acknowledgeReconnect };
}
