const { getIO } = require('./socketServer');

/**
 * Weather Socket Server
 * Handles all real-time weather events
 * Emits: weather:update, weather:alert, weather:aqi, weather:transport-risk, weather:hostel-alert, weather:system-health
 */

class WeatherSocketServer {
  constructor() {
    this.weatherRooms = ['weather:admin', 'weather:teacher', 'weather:student', 'weather:parent', 'weather:hostel', 'weather:transport'];
  }

  /**
   * Emit weather update to all connected clients
   */
  emitWeatherUpdate(data) {
    try {
      const io = getIO();
      io.emit('weather:update', data);
    } catch (e) {
      console.error('❌ [WeatherSocket] Failed to emit weather:update', e.message);
    }
  }

  /**
   * Emit weather alert to specific roles or all
   */
  emitWeatherAlert(alert) {
    try {
      const io = getIO();
      const targetRoles = alert.targetRoles || ['admin', 'teacher', 'student', 'parent', 'hostel', 'transport'];
      const roomRoles = targetRoles.includes('all')
        ? this.weatherRooms.map((room) => room.slice('weather:'.length))
        : targetRoles.map((role) => role === 'warden' ? 'hostel' : role);
      [...new Set(roomRoles)].forEach((role) => {
        if (this.weatherRooms.includes(`weather:${role}`)) {
          io.to(`weather:${role}`).emit('weather:alert', alert);
        }
      });

    } catch (e) {
      console.error('❌ [WeatherSocket] Failed to emit weather:alert', e.message);
    }
  }

  /**
   * Emit AQI update
   */
  emitAQIUpdate(aqiData) {
    try {
      const io = getIO();
      io.emit('weather:aqi', aqiData);
    } catch (e) {
      console.error('❌ [WeatherSocket] Failed to emit weather:aqi', e.message);
    }
  }

  /**
   * Emit transport risk update
   */
  emitTransportRisk(data) {
    try {
      const io = getIO();
      io.emit('weather:transport-risk', data);
    } catch (e) {
      console.error('❌ [WeatherSocket] Failed to emit weather:transport-risk', e.message);
    }
  }

  /**
   * Emit hostel alert
   */
  emitHostelAlert(data) {
    try {
      const io = getIO();
      io.emit('weather:hostel-alert', data);
    } catch (e) {
      console.error('❌ [WeatherSocket] Failed to emit weather:hostel-alert', e.message);
    }
  }

  /**
   * Emit system health update
   */
  emitSystemHealth(data) {
    try {
      const io = getIO();
      io.emit('weather:system-health', data);
    } catch (e) {
      console.error('❌ [WeatherSocket] Failed to emit weather:system-health', e.message);
    }
  }

  /**
   * Register weather socket events on a socket instance
   */
  registerSocketEvents(socket) {
    // Join weather rooms based on user role
    socket.on('join:weather', () => {
      const role = socket.data.principal?.role;
      const roomRole = role === 'warden' ? 'hostel' : role;
      if (!role || !this.weatherRooms.includes(`weather:${roomRole}`)) return;
      socket.join(`weather:${roomRole}`);
    });

    // Admin requests manual refresh
    socket.on('weather:request-refresh', () => {
      if (socket.data.principal?.role !== 'admin') {
        socket.emit('weather:refresh-acknowledged', { error: 'Admin access required' });
        return;
      }
      console.log('[WeatherSocket] Admin requested weather refresh');
      // The cron job will handle actual refresh
      socket.emit('weather:refresh-acknowledged', { message: 'Refresh triggered' });
    });
  }
}

module.exports = new WeatherSocketServer();
