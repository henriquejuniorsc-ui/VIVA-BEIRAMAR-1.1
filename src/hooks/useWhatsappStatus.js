import { useState, useEffect, useRef, useCallback } from 'react';

export function useWhatsappStatus(uazFetch, configReady) {
  const [status, setStatus] = useState({ connected: false, number: '' });
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef(null);

  const check = useCallback(async () => {
    if (!configReady) return;
    try {
      const data = await uazFetch('/instance/status');
      const connected = !!(data?.connected || data?.state === 'open' || data?.instance?.state === 'open');
      const number = data?.number || data?.instance?.number || data?.me?.id?.split(':')[0] || '';
      setStatus({ connected, number });
      return connected;
    } catch (e) {
      console.error('WhatsApp status check error:', e);
      setStatus({ connected: false, number: '' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [uazFetch, configReady]);

  useEffect(() => {
    if (!configReady) return;
    check();
    intervalRef.current = setInterval(check, 10000);
    return () => clearInterval(intervalRef.current);
  }, [check, configReady]);

  const startPolling = useCallback((ms = 5000) => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(check, ms);
  }, [check]);

  const stopPolling = useCallback(() => {
    clearInterval(intervalRef.current);
  }, []);

  const logout = useCallback(async () => {
    try {
      await uazFetch('/instance/logout', { method: 'POST' });
      setStatus({ connected: false, number: '' });
    } catch (e) {
      console.error('Logout error:', e);
    }
  }, [uazFetch]);

  return { status, isLoading, check, startPolling, stopPolling, logout };
}
