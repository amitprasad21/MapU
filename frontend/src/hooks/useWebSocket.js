import { useEffect, useRef, useState, useCallback } from 'react';

export const useWebSocket = (onAlertReceived) => {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    // Determine the WebSocket protocol and URL
    let wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      // Convert http/https URL to ws/wss
      wsUrl = apiHost.replace(/^http/, 'ws') + '/ws/alerts';
    }

    console.log('Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (onAlertReceived) {
          onAlertReceived(payload);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected. Retrying connection in 5s...');
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close();
    };
  }, [onAlertReceived]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // Disable reconnect handler on teardown
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return isConnected;
};
export default useWebSocket;
