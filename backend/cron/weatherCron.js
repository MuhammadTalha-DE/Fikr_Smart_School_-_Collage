const cron = require('node-cron');
const weatherApi = require('../services/weatherApiService');
const WeatherHistory = require('../models/WeatherHistory');
const WeatherSetting = require('../models/WeatherSetting');
const WeatherCurrent = require('../models/WeatherCurrent');
const alertService = require('../services/weatherAlertService');
const weatherSocket = require('../socket/weatherSocketServer');
const notificationService = require('../services/weatherNotificationService');

/**
 * Weather Cron Jobs
 * Handles automatic weather data refresh and alert evaluation
 */

class WeatherCron {
  constructor() {
    this.isRunning = false;
    this.isStarted = false;
    this.jobs = [];
    this.lastRefreshTime = null;
    this.refreshCount = 0;
  }

  /**
   * Start all weather cron jobs
   */
  startAll() {
    if (this.isStarted) {
      console.log('[WeatherCron] Weather cron jobs already registered');
      return;
    }

    console.log('[WeatherCron] Starting weather cron jobs...');

    this.jobs.push(cron.schedule('*/10 * * * *', async () => {
      await this.refreshWeatherData();
    }));

    this.jobs.push(cron.schedule('*/10 * * * *', async () => {
      await this.evaluateAlertRules();
    }));

    this.jobs.push(cron.schedule('0 * * * *', async () => {
      await this.resolveExpiredAlerts();
    }));

    this.jobs.push(cron.schedule('0 */6 * * *', async () => {
      await this.cleanupOldRecords();
    }));

    setTimeout(async () => {
      await this.refreshWeatherData();
      await this.evaluateAlertRules();
    }, 5000);

    this.isStarted = true;
    console.log('[WeatherCron] All weather cron jobs registered');
  }

  /**
   * Refresh weather data from API and save to history
   */
  async refreshWeatherData() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const settings = await WeatherSetting.getSettings();
      weatherApi.setLocation(settings.latitude, settings.longitude, settings.locationName);

      const data = await weatherApi.getComprehensiveWeather(
        settings.latitude,
        settings.longitude
      );

      const usingFallback = Boolean(data.current?.isFallback);

      if (!usingFallback) {
        await WeatherHistory.create({
          ...data.current,
          aqi: data.aqi?.aqi,
          pm25: data.aqi?.pm25,
          pm10: data.aqi?.pm10,
          locationName: settings.locationName,
        });

        await WeatherCurrent.findOneAndUpdate(
          { latitude: settings.latitude, longitude: settings.longitude },
          {
            ...data.current,
            aqi: data.aqi?.aqi,
            pm25: data.aqi?.pm25,
            pm10: data.aqi?.pm10,
            locationName: settings.locationName,
          },
          { upsert: true, new: true }
        );
      }

      weatherSocket.emitWeatherUpdate(data.current);

      if (data.aqi) {
        weatherSocket.emitAQIUpdate(data.aqi);
      }

      const transportRisk = alertService.assessTransportRisk(data.current);
      weatherSocket.emitTransportRisk(transportRisk);

      const hostelEnv = alertService.assessHostelEnvironment(data.current);
      weatherSocket.emitHostelAlert(hostelEnv);

      weatherSocket.emitSystemHealth({
        lastSync: usingFallback
          ? (this.lastRefreshTime ? this.lastRefreshTime.toISOString() : 'No successful sync yet')
          : 'Just now',
        refreshCount: usingFallback ? this.refreshCount : this.refreshCount + 1,
        apiStatus: usingFallback ? 'degraded' : 'operational',
        message: usingFallback
          ? (data.current?.apiError || 'Using cached or fallback weather data')
          : 'Live weather OK',
        timestamp: new Date().toISOString(),
      });

      if (usingFallback) {
        console.warn(`[WeatherCron] Live refresh unavailable. Serving ${data.current?.source}.`);
      } else {
        this.lastRefreshTime = new Date();
        this.refreshCount += 1;
        console.log(`[WeatherCron] Weather refreshed at ${this.lastRefreshTime.toISOString()}`);
      }
    } catch (error) {
      console.error('[WeatherCron] Refresh failed:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Evaluate auto-alert rules
   */
  async evaluateAlertRules() {
    try {
      const settings = await WeatherSetting.getSettings();
      if (!settings.autoAlertsEnabled) return;

      const current = await weatherApi.getCurrentWeather(
        settings.latitude,
        settings.longitude
      );

      const aqi = await weatherApi.getAQI(settings.latitude, settings.longitude);
      const weatherWithAQI = { ...current, aqi: aqi.aqi };
      const alerts = await alertService.evaluateAlerts(weatherWithAQI);

      if (alerts.length > 0) {
        console.log(`[WeatherCron] Generated ${alerts.length} automatic alerts`);
      }
    } catch (error) {
      console.error('[WeatherCron] Alert evaluation failed:', error.message);
    }
  }

  /**
   * Resolve expired alerts
   */
  async resolveExpiredAlerts() {
    try {
      const result = await alertService.resolveExpiredAlerts();
      if (result.modifiedCount > 0) {
        console.log(`[WeatherCron] Resolved ${result.modifiedCount} expired alerts`);
      }
    } catch (error) {
      console.error('[WeatherCron] Expired alert resolution failed:', error.message);
    }
  }

  /**
   * Clean up old records from WeatherCurrent collection
   */
  async cleanupOldRecords() {
    try {
      const result = await WeatherCurrent.deleteMany({
        recordedAt: { $lt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      });

      if (result.deletedCount > 0) {
        console.log(`[WeatherCron] Cleaned up ${result.deletedCount} old current records`);
      }
    } catch (error) {
      console.error('[WeatherCron] Cleanup failed:', error.message);
    }
  }

  /**
   * Force refresh (called from admin API)
   */
  async forceRefresh() {
    await this.refreshWeatherData();
    return { success: true, lastRefresh: this.lastRefreshTime };
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isStarted: this.isStarted,
      lastRefreshTime: this.lastRefreshTime,
      refreshCount: this.refreshCount,
    };
  }
}

module.exports = new WeatherCron();
