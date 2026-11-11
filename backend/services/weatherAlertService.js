const WeatherAlert = require('../models/WeatherAlert');
const WeatherSetting = require('../models/WeatherSetting');
const weatherSocket = require('../socket/weatherSocketServer');
const { broadcastAlert } = require('./notificationService');
const notificationCenterService = require('./notificationCenterService');

/**
 * Weather Alert Service
 * Automatic alert rules engine that monitors weather conditions
 * and generates alerts based on configured thresholds
 */

class WeatherAlertService {
  /**
   * Evaluate current weather against all alert rules
   * Called by cron job every refresh interval
   */
  async evaluateAlerts(weatherData) {
    if (!weatherData) return [];

    const settings = await WeatherSetting.getSettings();
    if (!settings.autoAlertsEnabled) return [];

    const alerts = [];
    const condition = (weatherData.condition || '').toLowerCase();
    const temp = weatherData.temperature;
    const humidity = weatherData.humidity;
    const windSpeed = weatherData.windSpeed;
    const visibility = weatherData.visibility;
    const rainfall = weatherData.rainfall || 0;
    const aqi = weatherData.aqi;

    const thresholds = settings.thresholds;

    // ─── Rule 1: Heat Alert ───────────────────────────────────
    if (temp >= thresholds.highTemperature) {
      const exists = await this.hasActiveAlertOfType('heat');
      if (!exists) {
        const alert = await this.createAutoAlert({
          title: '🌡️ Extreme Heat Warning',
          message: `Temperature has reached ${temp}°C. All outdoor activities are suspended. Stay hydrated and avoid direct sun exposure.`,
          type: 'heat',
          severity: temp >= 40 ? 'critical' : 'high',
          targetRoles: ['admin', 'teacher', 'student', 'parent', 'hostel'],
        });
        alerts.push(alert);
      }
    }

    // ─── Rule 2: Rain Alert ───────────────────────────────────
    if (condition.includes('rain') || rainfall >= thresholds.heavyRain) {
      const exists = await this.hasActiveAlertOfType('rain');
      if (!exists) {
        const alert = await this.createAutoAlert({
          title: '🌧️ Heavy Rain Alert',
          message: `Heavy rainfall detected (${rainfall}mm). Transport may be delayed. Students should carry umbrellas. Outdoor activities moved indoors.`,
          type: 'rain',
          severity: rainfall >= thresholds.heavyRain * 1.5 ? 'high' : 'medium',
          targetRoles: ['admin', 'teacher', 'student', 'parent', 'transport', 'hostel'],
        });
        alerts.push(alert);
      }
    }

    // ─── Rule 3: AQI Alert ────────────────────────────────────
    if (aqi && aqi >= thresholds.poorAQI / 50) { // aqi from API is 1-5 scale
      const exists = await this.hasActiveAlertOfType('aqi');
      if (!exists) {
        const aqiLabel = aqi >= 4 ? 'Poor' : 'Moderate';
        const alert = await this.createAutoAlert({
          title: '🌫️ Air Quality Warning',
          message: `AQI level is ${aqiLabel}. Sensitive individuals should limit outdoor activities. Masks recommended for students with respiratory conditions.`,
          type: 'aqi',
          severity: aqi >= 4 ? 'high' : 'medium',
          targetRoles: ['admin', 'teacher', 'student', 'parent', 'hostel'],
        });
        alerts.push(alert);
      }
    }

    // ─── Rule 4: Fog / Low Visibility Alert ───────────────────
    if (condition.includes('fog') || condition.includes('mist') || condition.includes('haze') || visibility <= thresholds.lowVisibility) {
      const exists = await this.hasActiveAlertOfType('fog');
      if (!exists) {
        const alert = await this.createAutoAlert({
          title: '🌁 Low Visibility Alert',
          message: `Visibility is ${visibility}km due to ${condition}. Transport drivers are advised to drive carefully. Parents will be notified of potential delays.`,
          type: 'fog',
          severity: visibility <= 1 ? 'critical' : 'high',
          targetRoles: ['admin', 'transport', 'parent', 'teacher', 'student'],
        });
        alerts.push(alert);
      }
    }

    // ─── Rule 5: Strong Wind Alert ────────────────────────────
    if (windSpeed >= thresholds.strongWind) {
      const exists = await this.hasActiveAlertOfType('wind');
      if (!exists) {
        const alert = await this.createAutoAlert({
          title: '💨 Strong Wind Warning',
          message: `Wind speed is ${windSpeed} km/h. Outdoor activities suspended. Transport caution advised. Secure loose objects around campus.`,
          type: 'wind',
          severity: windSpeed >= thresholds.strongWind * 1.5 ? 'critical' : 'high',
          targetRoles: ['admin', 'teacher', 'student', 'transport', 'hostel'],
        });
        alerts.push(alert);
      }
    }

    // ─── Rule 6: Storm / Thunderstorm Alert ──────────────────
    if (condition.includes('thunderstorm') || condition.includes('storm')) {
      const exists = await this.hasActiveAlertOfType('storm');
      if (!exists) {
        const alert = await this.createAutoAlert({
          title: '⛈️ Thunderstorm Warning',
          message: `Thunderstorm conditions detected. All outdoor activities must stop immediately. Stay indoors. Avoid open fields and tall structures.`,
          type: 'storm',
          severity: 'critical',
          targetRoles: ['admin', 'teacher', 'student', 'parent', 'hostel', 'transport'],
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Check if there's already an active alert of the given type
   */
  async hasActiveAlertOfType(type) {
    const count = await WeatherAlert.countDocuments({
      type,
      isActive: true,
      isAutomatic: true,
      createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) }, // within last 6 hours
    });
    return count > 0;
  }

  /**
   * Create an automatic alert
   */
  async createAutoAlert({ title, message, type, severity, targetRoles }) {
    const alert = await WeatherAlert.create({
      title,
      message,
      type,
      severity,
      targetRoles,
      isActive: true,
      isAutomatic: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Emit via socket
    weatherSocket.emitWeatherAlert(alert);

    // Send notifications
    try {
      await broadcastAlert({
        alert,
        users: targetRoles, // In production, fetch user emails/FCM tokens
      });
    } catch (e) {
      console.error('❌ [AlertService] Notification broadcast failed:', e.message);
    }

    console.log(`✅ [AlertService] Auto-alert created: ${title} [${severity}]`);
    notificationCenterService.createAndDispatch({
      title,
      message,
      type: 'weather',
      severity,
      channels: ['in_app', 'email'],
      roles: targetRoles,
      metadata: {
        entity: 'WeatherAlert',
        entityId: alert._id,
        link: '/admin/weather/alerts',
        context: { alertType: type, automatic: true },
      },
      sourceModule: 'weather',
    }).catch((error) => {
      console.error('Notification center dispatch failed:', error.message);
    });

    return alert;
  }

  /**
   * Manually resolve all expired alerts
   */
  async resolveExpiredAlerts() {
    const result = await WeatherAlert.updateMany(
      { isActive: true, expiresAt: { $lte: new Date() } },
      { isActive: false, resolvedAt: new Date() }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ [AlertService] Resolved ${result.modifiedCount} expired alerts`);
    }
    return result;
  }

  /**
   * Get transport risk assessment based on weather
   */
  assessTransportRisk(weather) {
    const risks = [];
    const condition = (weather.condition || '').toLowerCase();
    const visibility = weather.visibility;
    const windSpeed = weather.windSpeed;
    const rainfall = weather.rainfall || 0;

    if (condition.includes('rain') || rainfall > 5) {
      risks.push({ factor: 'Rain', risk: rainfall > 15 ? 'high' : 'medium', advice: 'Roads may be slippery. Reduce speed.' });
    }
    if (condition.includes('fog') || visibility < 3) {
      risks.push({ factor: 'Fog/Low Visibility', risk: visibility < 1 ? 'high' : 'medium', advice: 'Use fog lights. Maintain safe distance.' });
    }
    if (windSpeed > 25) {
      risks.push({ factor: 'Strong Wind', risk: windSpeed > 35 ? 'high' : 'medium', advice: 'High-profile vehicles should exercise caution.' });
    }
    if (condition.includes('storm') || condition.includes('thunderstorm')) {
      risks.push({ factor: 'Storm', risk: 'high', advice: 'Consider suspending transport until conditions improve.' });
    }

    return {
      overallRisk: risks.some(r => r.risk === 'high') ? 'high' : risks.length > 0 ? 'medium' : 'low',
      risks,
      suggestedAction: risks.length === 0 ? 'No action needed' : 'Notify drivers and parents',
    };
  }

  /**
   * Get hostel environmental assessment based on weather
   */
  assessHostelEnvironment(weather) {
    const issues = [];
    const temp = weather.temperature;
    const humidity = weather.humidity;
    const condition = (weather.condition || '').toLowerCase();

    if (humidity > 80) issues.push({ factor: 'High Humidity', severity: 'medium', advice: 'Check ventilation. Monitor for mold.' });
    if (temp >= 38) issues.push({ factor: 'Extreme Heat', severity: 'high', advice: 'Ensure AC/fans are operational.' });
    if (temp <= 5) issues.push({ factor: 'Extreme Cold', severity: 'high', advice: 'Check heating. Provide extra blankets.' });
    if (condition.includes('rain') || condition.includes('storm')) issues.push({ factor: 'Rain/Storm', severity: 'medium', advice: 'Check for roof leaks. Secure windows.' });

    return {
      overallStatus: issues.some(i => i.severity === 'high') ? 'attention' : issues.length > 0 ? 'monitor' : 'normal',
      issues,
    };
  }
}

module.exports = new WeatherAlertService();
