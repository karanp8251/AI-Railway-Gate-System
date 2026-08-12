import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [events, setEvents] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('connect', () => {
      if (user?.role) s.emit('join:role', user.role);
    });

    const handlers = ['gate:status', 'alert:new', 'ai:detection', 'sensor:update', 'system:lockdown', 'esp:sender', 'esp:receiver'];
    handlers.forEach((event) => {
      s.on(event, (data) => {
        console.log(`[Socket] Event: ${event}`, data);
        setEvents((prev) => [{ event, data, ts: Date.now() }, ...prev].slice(0, 50));
      });
    });

    return () => s.disconnect();
  }, [isAuthenticated, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, events, clearEvents: () => setEvents([]) }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
