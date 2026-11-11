import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { getSocketAuth } from '../utils/socketAuth';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

/**
 * Custom hook for real-time weather updates via Socket.IO
 * Provides live weather data, alerts, AQI, and system health
 */
const useWeatherSocket = (options = {}) => {
  const { enabled = true } = options;
  const { user } = useAuth();

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveWeather, setLiveWeather] = useState(null);
  const [liveAlert, setLiveAlert] = useState(null);
  const [liveAQI, setLiveAQI] = useState(null);
  const [transportRisk, setTransportRisk] = useState(null);
  const [hostelAlert, setHostelAlert] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!enabled || !user) return undefined;

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: getSocketAuth(),
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('[WeatherSocket] Connected:', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[WeatherSocket] Disconnected');
      setConnected(false);
    });

    socketInstance.on('weather:update', (data) => {
      setLiveWeather(data);
      setLastUpdate(new Date());
    });

    socketInstance.on('weather:alert', (alert) => {
      setLiveAlert(alert);
      setLastUpdate(new Date());
    });

    socketInstance.on('weather:aqi', (data) => {
      setLiveAQI(data);
      setLastUpdate(new Date());
    });

    socketInstance.on('weather:transport-risk', (data) => {
      setTransportRisk(data);
      setLastUpdate(new Date());
    });

    socketInstance.on('weather:hostel-alert', (data) => {
      setHostelAlert(data);
      setLastUpdate(new Date());
    });

    socketInstance.on('weather:system-health', (data) => {
      setSystemHealth(data);
      setLastUpdate(new Date());
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [enabled, user?.token]);

  const clearAlert = useCallback(() => {
    setLiveAlert(null);
  }, []);

  return {
    socket,
    connected,
    liveWeather,
    liveAlert,
    liveAQI,
    transportRisk,
    hostelAlert,
    systemHealth,
    lastUpdate,
    clearAlert,
  };
};

export default useWeatherSocket;
