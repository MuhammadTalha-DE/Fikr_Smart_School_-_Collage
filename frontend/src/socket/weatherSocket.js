import { io } from 'socket.io-client';
import { getSocketAuth } from '../utils/socketAuth';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let weatherSocket = null;

export const connectWeatherSocket = (userId = null) => {
  if (weatherSocket?.connected) return weatherSocket;

  weatherSocket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: getSocketAuth(),
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  weatherSocket.on('connect', () => {
    console.log('[WeatherSocket] Connected:', weatherSocket.id);
    if (userId) {
      weatherSocket.emit('join:weather', userId);
    }
  });

  weatherSocket.on('disconnect', () => {
    console.log('[WeatherSocket] Disconnected');
  });

  return weatherSocket;
};

export const disconnectWeatherSocket = () => {
  if (weatherSocket) {
    weatherSocket.disconnect();
    weatherSocket = null;
  }
};

export const getWeatherSocket = () => weatherSocket;

export default weatherSocket;
