import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { getAlerts, acknowledgeAlert as apiAcknowledge, getSseToken } from '../api/alerts';
import toast from 'react-hot-toast';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const { user, token, isAdmin } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef(null);

  const fetchAlerts = async () => {
    if (!user) return;
    try {
      const data = await getAlerts();
      setAlerts(data.alerts || []);
      setUnreadCount((data.alerts || []).length);
    } catch (err) {
      console.error('Failed to fetch alerts:', err.message);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAlerts();
  }, [user]);

  // SSE connection for admins — uses a short-lived SSE token to avoid
  // placing the long-lived JWT in the URL (logs, browser history, proxy logs)
  useEffect(() => {
    if (!isAdmin || !token) return;

    let cancelled = false;

    const connect = async () => {
      try {
        const sseToken = await getSseToken();
        if (cancelled) return;

        // EventSource cannot set custom headers, so we use a short-lived SSE token
        // in the URL instead of the primary JWT.
        // The full backend URL must be explicit — a relative /api path would hit
        // the Vercel frontend origin, not the Render backend.
        const backendBase = import.meta.env.VITE_BASE_URL;
        const url = `${backendBase}/api/sse/alerts?token=${sseToken}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.addEventListener('alert', (e) => {
          try {
            const alert = JSON.parse(e.data);
            setAlerts((prev) => [alert, ...prev]);
            setUnreadCount((prev) => prev + 1);
            toast.error(`🚨 ${alert.message}`, { duration: 6000 });
          } catch {}
        });

        es.addEventListener('connected', () => {
          // SSE stream established — no action needed
        });

        es.onerror = () => {
          es.close();
          if (!cancelled) {
            // Reconnect after 5s (fetches a fresh short-lived token each time)
            setTimeout(connect, 5000);
          }
        };
      } catch (err) {
        console.error('[SSE] Failed to get SSE token:', err.message);
        if (!cancelled) setTimeout(connect, 10000);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isAdmin, token]);

  const acknowledgeAlert = async (id) => {
    try {
      await apiAcknowledge(id);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to acknowledge alert');
    }
  };

  return (
    <AlertContext.Provider value={{ alerts, unreadCount, fetchAlerts, acknowledgeAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
  return ctx;
}
