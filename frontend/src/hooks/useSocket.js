import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getSocketAuth } from '../utils/socketAuth';

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    return window.location.origin;
  }

  if (apiUrl.startsWith('/')) {
    return window.location.origin;
  }

  return apiUrl.replace(/\/api\/?$/, '');
};

const SOCKET_URL = getSocketUrl();

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: getSocketAuth(),
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current = socket;
    setSocketInstance(socket);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
      setIsConnected(false);
    };
  }, [user]);

  return {
    socket: socketInstance,
    isConnected,
  };
};
