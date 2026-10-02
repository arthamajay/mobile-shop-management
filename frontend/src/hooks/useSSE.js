import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for Server-Sent Events
 * @param {string|null} url - SSE endpoint URL (pass null to disable)
 * @returns {{ data: any, error: any, connected: boolean }}
 */
export function useSSE(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
        setError(null);
        if (reconnectRef.current) {
          clearTimeout(reconnectRef.current);
          reconnectRef.current = null;
        }
      };

      es.onmessage = (e) => {
        try {
          setData(JSON.parse(e.data));
        } catch {
          setData(e.data);
        }
      };

      es.addEventListener('alert', (e) => {
        try {
          setData({ type: 'alert', payload: JSON.parse(e.data) });
        } catch {
          setData({ type: 'alert', payload: e.data });
        }
      });

      es.onerror = (err) => {
        setConnected(false);
        setError(err);
        es.close();
        reconnectRef.current = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
    };
  }, [url]);

  return { data, error, connected };
}
