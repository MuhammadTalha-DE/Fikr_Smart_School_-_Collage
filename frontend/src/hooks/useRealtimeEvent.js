import { useEffect } from 'react';
import { useSocket } from './useSocket';

export const useRealtimeEvent = (eventName, handler, options = {}) => {
  const { socket, isConnected } = useSocket();
  const { rooms = [], classIds = [], modules = [], enabled = true } = options;

  useEffect(() => {
    if (!socket || !enabled) return undefined;

    const hasRooms = rooms.length || classIds.length || modules.length;
    if (hasRooms) {
      socket.emit('join:rooms', { rooms, classIds, modules });
    }

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
      if (hasRooms) {
        socket.emit('leave:rooms', { rooms, classIds, modules });
      }
    };
  }, [
    socket,
    enabled,
    eventName,
    handler,
    JSON.stringify(rooms),
    JSON.stringify(classIds),
    JSON.stringify(modules),
  ]);

  return { socket, isConnected };
};

export default useRealtimeEvent;
