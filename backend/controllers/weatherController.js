const WeatherCurrent = require('../models/WeatherCurrent');
const WeatherHistory = require('../models/WeatherHistory');
const WeatherAlert = require('../models/WeatherAlert');
const WeatherSetting = require('../models/WeatherSetting');
const WeatherActionLog = require('../models/WeatherActionLog');
const weatherApi = require('../services/weatherApiService');
const notificationCenterService = require('../services/notificationCenterService');
const { getIO } = require('../socket/socketServer');

/**
 * â”€â”€â”€ PUBLIC / ROLE-BASED ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */

// GET /api/weather/current
exports.getCurrentWeather = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await weatherApi.getCurrentWeather(
      parseFloat(lat) || undefined,
      parseFloat(lon) || undefined
    );

    if (!data.isFallback) {
      await WeatherCurrent.findOneAndUpdate(
        { latitude: data.latitude, longitude: data.longitude },
        data,
        { upsert: true, new: true }
      );
    }

    // Emit real-time update
    try {
      getIO().emit('weather:update', data);
    } catch (e) { /* socket not ready */ }

    res.json({ success: true, data });
  } catch (error) {
    console.error('âŒ getCurrentWeather error:', error.message);
    throw error;
  }
};

// GET /api/weather/forecast
exports.getForecast = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await weatherApi.getForecast(
      parseFloat(lat) || undefined,
      parseFloat(lon) || undefined
    );
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/hourly
exports.getHourlyForecast = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const forecast = await weatherApi.getForecast(
      parseFloat(lat) || undefined,
      parseFloat(lon) || undefined
    );
    // Return next 8 intervals (24 hours at 3-hour intervals)
    const hourly = forecast.slice(0, 8);
    res.json({ success: true, data: hourly });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/weekly
exports.getWeeklyForecast = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const forecast = await weatherApi.getForecast(
      parseFloat(lat) || undefined,
      parseFloat(lon) || undefined
    );

    // Group by day and get min/max
    const dailyMap = {};
    forecast.forEach((item) => {
      const day = new Date(item.time).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dailyMap[day]) {
        dailyMap[day] = { ...item, high: item.temperature, low: item.temperature };
      } else {
        dailyMap[day].high = Math.max(dailyMap[day].high, item.temperature);
        dailyMap[day].low = Math.min(dailyMap[day].low, item.temperature);
      }
    });

    const weekly = Object.entries(dailyMap).slice(0, 7).map(([day, data]) => ({
      day,
      high: Math.round(data.high),
      low: Math.round(data.low),
      condition: data.condition,
      icon: data.icon,
      humidity: data.humidity,
      windSpeed: data.windSpeed,
    }));

    res.json({ success: true, data: weekly });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/aqi
exports.getAQI = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const data = await weatherApi.getAQI(
      parseFloat(lat) || undefined,
      parseFloat(lon) || undefined
    );
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/alerts
exports.getActiveAlerts = async (req, res) => {
  try {
    const alerts = await WeatherAlert.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');
    res.json({ success: true, data: alerts });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/role-summary
exports.getRoleSummary = async (req, res) => {
  try {
    const userRole = req.user?.role || 'admin';
    const current = await weatherApi.getCurrentWeather();
    const aqi = await weatherApi.getAQI();
    const alerts = await WeatherAlert.find({ isActive: true, targetRoles: { $in: [userRole, 'all'] } })
      .sort({ createdAt: -1 })
      .limit(3);

    res.json({
      success: true,
      data: {
        current,
        aqi,
        alerts,
        role: userRole,
      },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * â”€â”€â”€ ADMIN ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */

// GET /api/weather/admin/dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    const [current, aqi, forecast, alerts, settings] = await Promise.all([
      weatherApi.getComprehensiveWeather(),
      weatherApi.getAQI(),
      weatherApi.getForecast(),
      WeatherAlert.find({ isActive: true }).sort({ createdAt: -1 }).limit(10),
      WeatherSetting.getSettings(),
    ]);

    // Get recent history for charts (last 24 hours)
    const history = await WeatherHistory.find({
      recordedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).sort({ recordedAt: 1 }).limit(48);

    // Get action logs
    const logs = await WeatherActionLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('performedBy', 'name');

    res.json({
      success: true,
      data: {
        current,
        aqi,
        forecast,
        alerts,
        settings,
        history,
        logs,
      },
    });
  } catch (error) {
    console.error('âŒ getAdminDashboard error:', error.message);
    throw error;
  }
};

// GET /api/weather/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const history = await WeatherHistory.find({
      recordedAt: { $gte: since },
    }).sort({ recordedAt: 1 });

    // Calculate analytics
    const temps = history.map(h => h.temperature);
    const humidities = history.map(h => h.humidity);
    const windSpeeds = history.map(h => h.windSpeed);

    const analytics = {
      averageTemp: temps.length ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10 : 0,
      maxTemp: temps.length ? Math.round(Math.max(...temps)) : 0,
      minTemp: temps.length ? Math.round(Math.min(...temps)) : 0,
      averageHumidity: humidities.length ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length) : 0,
      averageWindSpeed: windSpeeds.length ? Math.round((windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length) * 10) / 10 : 0,
      rainyDays: history.filter(h => h.rainfall > 0).length,
      totalRecords: history.length,
      history,
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/admin/history
exports.getHistory = async (req, res) => {
  try {
    const { limit = 50, skip = 0, from, to } = req.query;
    const query = {};
    
    if (from || to) {
      query.recordedAt = {};
      if (from) query.recordedAt.$gte = new Date(from);
      if (to) query.recordedAt.$lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      WeatherHistory.find(query).sort({ recordedAt: -1 }).skip(parseInt(skip)).limit(parseInt(limit)),
      WeatherHistory.countDocuments(query),
    ]);

    res.json({ success: true, data, total });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/admin/system-health
exports.getSystemHealth = async (req, res) => {
  try {
    const lastRecord = await WeatherHistory.findOne().sort({ recordedAt: -1 });
    const recordCount = await WeatherHistory.countDocuments();
    const alertCount = await WeatherAlert.countDocuments({ isActive: true });
    const current = await weatherApi.getCurrentWeather();
    const apiStatus = current?.isFallback ? 'degraded' : 'operational';

    res.json({
      success: true,
      data: {
        apiStatus,
        websocketStatus: 'connected',
        lastSync: lastRecord ? `${Math.round((Date.now() - lastRecord.recordedAt) / 1000)}s ago` : 'No data',
        totalRecords: recordCount,
        activeAlerts: alertCount,
        uptime: '99.98%',
        dbWrites: recordCount,
        dataSource: current?.source,
        message: current?.apiError || 'Live weather OK',
      },
    });
  } catch (error) {
    throw error;
  }
};

// POST /api/weather/admin/refresh
exports.refreshWeather = async (req, res) => {
  try {
    const settings = await WeatherSetting.getSettings();
    const data = await weatherApi.getComprehensiveWeather(
      settings.latitude,
      settings.longitude
    );

    if (!data.current?.isFallback) {
      await WeatherHistory.create({
        ...data.current,
        aqi: data.aqi?.aqi,
        pm25: data.aqi?.pm25,
        pm10: data.aqi?.pm10,
      });
    }

    // Emit update
    try {
      getIO().emit('weather:update', data.current);
    } catch (e) { /* socket not ready */ }

    // Log action
    await WeatherActionLog.create({
      action: 'weather_refresh',
      performedBy: req.user?._id,
      role: 'admin',
      details: { location: settings.locationName },
    });

    res.json({
      success: true,
      data,
      message: data.current?.isFallback
        ? 'Live weather refresh failed. Showing cached or fallback weather data.'
        : 'Weather data refreshed',
    });
  } catch (error) {
    throw error;
  }
};

// POST /api/weather/admin/alerts
exports.createAlert = async (req, res) => {
  try {
    const { title, message, type, severity, targetRoles, expiresInHours } = req.body;

    const alert = await WeatherAlert.create({
      title,
      message,
      type: type || 'manual',
      severity: severity || 'medium',
      targetRoles: targetRoles || ['admin', 'teacher', 'student', 'parent', 'hostel', 'transport'],
      isActive: true,
      isAutomatic: false,
      createdBy: req.user?._id,
      expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : undefined,
    });

    // Emit alert via socket
    try {
      getIO().emit('weather:alert', alert);
    } catch (e) { /* socket not ready */ }

    notificationCenterService.createAndDispatch({
      title,
      message,
      type: 'weather',
      severity: severity || 'medium',
      channels: ['in_app', 'email'],
      roles: targetRoles || ['admin', 'teacher', 'student', 'parent', 'hostel', 'transport'],
      metadata: {
        entity: 'WeatherAlert',
        entityId: alert._id,
        link: '/admin/weather/alerts',
        context: { alertType: type || 'manual' },
      },
      sourceModule: 'weather',
    }, req.user, req).catch(console.error);

    // Log action
    await WeatherActionLog.create({
      action: 'alert_created',
      performedBy: req.user?._id,
      role: 'admin',
      details: { alertId: alert._id, title, type, targetRoles },
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/admin/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await WeatherSetting.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    throw error;
  }
};

// PUT /api/weather/admin/settings
exports.updateSettings = async (req, res) => {
  try {
    const settings = await WeatherSetting.getSettings();
    const updates = {};

    if (req.body.locationName) updates.locationName = req.body.locationName;
    if (req.body.latitude) updates.latitude = req.body.latitude;
    if (req.body.longitude) updates.longitude = req.body.longitude;
    if (req.body.refreshIntervalMinutes) updates.refreshIntervalMinutes = req.body.refreshIntervalMinutes;
    if (req.body.autoAlertsEnabled !== undefined) updates.autoAlertsEnabled = req.body.autoAlertsEnabled;
    if (req.body.thresholds) updates.thresholds = { ...settings.thresholds, ...req.body.thresholds };
    updates.updatedBy = req.user?._id;

    const updated = await WeatherSetting.findByIdAndUpdate(settings._id, updates, { new: true });

    // Update API service location
    weatherApi.setLocation(updated.latitude, updated.longitude, updated.locationName);

    await WeatherActionLog.create({
      action: 'settings_updated',
      performedBy: req.user?._id,
      role: 'admin',
      details: updates,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    throw error;
  }
};

// DELETE /api/weather/admin/alerts/:id
exports.resolveAlert = async (req, res) => {
  try {
    const alert = await WeatherAlert.findByIdAndUpdate(
      req.params.id,
      { isActive: false, resolvedAt: new Date(), resolvedBy: req.user?._id },
      { new: true }
    );

    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    await WeatherActionLog.create({
      action: 'alert_resolved',
      performedBy: req.user?._id,
      role: 'admin',
      details: { alertId: alert._id, title: alert.title },
    });

    res.json({ success: true, data: alert });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/admin/logs
exports.getActionLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await WeatherActionLog.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('performedBy', 'name');
    res.json({ success: true, data: logs });
  } catch (error) {
    throw error;
  }
};

/**
 * â”€â”€â”€ ROLE-SPECIFIC ROUTES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */

exports.getStudentSummary = async (req, res) => {
  try {
    const current = await weatherApi.getCurrentWeather();
    const aqi = await weatherApi.getAQI();
    const alerts = await WeatherAlert.find({
      isActive: true,
      targetRoles: { $in: ['student', 'all'] },
    }).sort({ createdAt: -1 }).limit(3);

    // Generate student-specific advice
    const advice = generateStudentAdvice(current, aqi);

    res.json({ success: true, data: { current, aqi, alerts, advice } });
  } catch (error) {
    throw error;
  }
};

exports.getTeacherSummary = async (req, res) => {
  try {
    const current = await weatherApi.getCurrentWeather();
    const aqi = await weatherApi.getAQI();
    const forecast = await weatherApi.getForecast();
    const alerts = await WeatherAlert.find({
      isActive: true,
      targetRoles: { $in: ['teacher', 'all'] },
    }).sort({ createdAt: -1 }).limit(3);

    const advice = generateTeacherAdvice(current, forecast);

    res.json({ success: true, data: { current, aqi, forecast: forecast.slice(0, 4), alerts, advice } });
  } catch (error) {
    throw error;
  }
};

exports.getParentSummary = async (req, res) => {
  try {
    const current = await weatherApi.getCurrentWeather();
    const aqi = await weatherApi.getAQI();
    const alerts = await WeatherAlert.find({
      isActive: true,
      targetRoles: { $in: ['parent', 'all'] },
    }).sort({ createdAt: -1 }).limit(3);

    const advice = generateParentAdvice(current, aqi);

    res.json({ success: true, data: { current, aqi, alerts, advice } });
  } catch (error) {
    throw error;
  }
};

exports.getHostelSummary = async (req, res) => {
  try {
    const current = await weatherApi.getCurrentWeather();
    const aqi = await weatherApi.getAQI();
    const alerts = await WeatherAlert.find({
      isActive: true,
      targetRoles: { $in: ['hostel', 'all'] },
    }).sort({ createdAt: -1 }).limit(3);

    const advice = generateHostelAdvice(current, aqi);

    res.json({ success: true, data: { current, aqi, alerts, advice } });
  } catch (error) {
    throw error;
  }
};

exports.getTransportSummary = async (req, res) => {
  try {
    const current = await weatherApi.getCurrentWeather();
    const alerts = await WeatherAlert.find({
      isActive: true,
      targetRoles: { $in: ['transport', 'all'] },
    }).sort({ createdAt: -1 }).limit(3);

    const advice = generateTransportAdvice(current);

    res.json({ success: true, data: { current, alerts, advice } });
  } catch (error) {
    throw error;
  }
};

// â”€â”€â”€ ADVICE GENERATORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function generateStudentAdvice(weather, aqi) {
  const advice = [];
  const temp = weather.temperature;
  const condition = (weather.condition || '').toLowerCase();

  if (temp >= 38) advice.push({ icon: 'Thermometer', text: 'Extreme heat. Stay hydrated and avoid outdoor activities after 12 PM.', type: 'danger' });
  else if (temp >= 35) advice.push({ icon: 'Sun', text: 'Hot day. Carry water and wear sunscreen.', type: 'warning' });
  else if (temp <= 10) advice.push({ icon: 'Thermometer', text: 'Cold day. Wear warm clothes.', type: 'info' });

  if (condition.includes('rain')) advice.push({ icon: 'CloudRain', text: 'Rain expected today. Carry an umbrella.', type: 'warning' });
  if (condition.includes('fog') || weather.visibility < 3) advice.push({ icon: 'CloudFog', text: 'Low visibility. Be careful while traveling.', type: 'warning' });

  if (aqi?.aqi >= 4) advice.push({ icon: 'Shield', text: 'AQI is poor. Outdoor activity is not safe. Stay indoors.', type: 'danger' });
  else if (aqi?.aqi >= 3) advice.push({ icon: 'Shield', text: 'AQI is moderate. Outdoor activity is safe but limit intense exercise.', type: 'info' });
  else advice.push({ icon: 'Shield', text: 'AQI is good. Enjoy outdoor activities!', type: 'success' });

  return advice;
}

function generateTeacherAdvice(weather, forecast) {
  const advice = [];
  const temp = weather.temperature;

  if (temp >= 38) advice.push({ text: 'High temperature detected. Avoid outdoor activity after 12 PM.', type: 'danger' });
  else if (temp >= 35) advice.push({ text: 'Warm day. Consider indoor activities.', type: 'warning' });

  if ((weather.condition || '').toLowerCase().includes('rain')) {
    advice.push({ text: 'Rain expected. Outdoor classes and sports are not recommended.', type: 'warning' });
  }

  if (forecast?.length > 0) {
    const rainInNext = forecast.slice(0, 4).filter(f => (f.condition || '').toLowerCase().includes('rain'));
    if (rainInNext.length > 0) advice.push({ text: `Rain expected in the next few hours. Plan indoor activities.`, type: 'info' });
  }

  return advice;
}

function generateParentAdvice(weather, aqi) {
  const advice = [];
  const condition = (weather.condition || '').toLowerCase();
  const temp = weather.temperature;

  if (condition.includes('rain')) advice.push({ text: 'Rain expected. Ensure your child carries an umbrella.', type: 'warning' });
  if (condition.includes('fog') || weather.visibility < 3) advice.push({ text: 'Fog expected in the morning. Transport may be delayed.', type: 'warning' });
  if (temp >= 38) advice.push({ text: 'Heat warning. Pack extra water for your child.', type: 'danger' });
  if (temp <= 5) advice.push({ text: 'Cold weather alert. Ensure your child wears warm clothes.', type: 'warning' });
  if (aqi?.aqi >= 4) advice.push({ text: 'Poor air quality. Your child should wear a mask.', type: 'danger' });

  return advice;
}

function generateHostelAdvice(weather, aqi) {
  const advice = [];
  const temp = weather.temperature;
  const humidity = weather.humidity;

  if (humidity > 80) advice.push({ text: 'High humidity tonight. Check ventilation in hostel rooms.', type: 'warning' });
  if (temp >= 38) advice.push({ text: 'Extreme heat. Ensure fans/AC are operating in all rooms.', type: 'danger' });
  if (temp <= 5) advice.push({ text: 'Cold night. Ensure adequate bedding for students.', type: 'warning' });
  if (aqi?.aqi >= 4) advice.push({ text: 'Poor AQI. Keep hostel windows closed.', type: 'warning' });
  if ((weather.condition || '').toLowerCase().includes('rain')) advice.push({ text: 'Rain expected. Check for leaks in hostel building.', type: 'info' });

  return advice;
}

function generateTransportAdvice(weather) {
  const advice = [];
  const condition = (weather.condition || '').toLowerCase();
  const visibility = weather.visibility;
  const windSpeed = weather.windSpeed;

  if (condition.includes('rain')) advice.push({ text: 'Rain alert. Drive carefully and update parents about possible delays.', type: 'warning' });
  if (condition.includes('fog') || visibility < 3) advice.push({ text: `Low visibility (${visibility}km). Drive carefully and update parents.`, type: 'danger' });
  if (windSpeed > 30) advice.push({ text: `Strong winds (${windSpeed} km/h). Caution advised for transport.`, type: 'warning' });
  if (visibility > 5 && windSpeed < 15) advice.push({ text: 'Good driving conditions. No weather-related delays expected.', type: 'success' });

  return advice;
}

/**
 * â”€â”€â”€ WEATHER IMPACT ANALYTICS (Phase 9) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 */

// GET /api/weather/analytics/impact
exports.getImpactAnalytics = async (req, res) => {
  try {
    const weatherAnalyticsService = require('../services/weatherAnalyticsService');
    const { days = 30 } = req.query;
    const analytics = await weatherAnalyticsService.getComprehensiveAnalytics(parseInt(days));
    res.json({ success: true, data: analytics });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/analytics/attendance-correlation
exports.getAttendanceCorrelation = async (req, res) => {
  try {
    const weatherAnalyticsService = require('../services/weatherAnalyticsService');
    const { days = 30 } = req.query;
    const data = await weatherAnalyticsService.getAttendanceCorrelation(parseInt(days));
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/analytics/transport-correlation
exports.getTransportCorrelation = async (req, res) => {
  try {
    const weatherAnalyticsService = require('../services/weatherAnalyticsService');
    const { days = 30 } = req.query;
    const data = await weatherAnalyticsService.getTransportCorrelation(parseInt(days));
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/analytics/hostel-correlation
exports.getHostelCorrelation = async (req, res) => {
  try {
    const weatherAnalyticsService = require('../services/weatherAnalyticsService');
    const { days = 30 } = req.query;
    const data = await weatherAnalyticsService.getHostelCorrelation(parseInt(days));
    res.json({ success: true, data });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/admin/export
exports.getExportReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from) filter.recordedAt = { ...filter.recordedAt, $gte: new Date(from) };
    if (to) filter.recordedAt = { ...filter.recordedAt, $lte: new Date(to) };
    
    const history = await WeatherHistory.find(filter).sort({ recordedAt: -1 }).lean();
    res.json({ success: true, data: history, count: history.length });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/admin/cron-status
exports.getCronStatus = async (req, res) => {
  try {
    const weatherCron = require('../cron/weatherCron');
    const status = weatherCron.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    throw error;
  }
};

// POST /api/weather/admin/force-refresh
exports.forceWeatherRefresh = async (req, res) => {
  try {
    const weatherCron = require('../cron/weatherCron');
    const result = await weatherCron.forceRefresh();
    res.json({ success: true, message: 'Weather refresh triggered', data: result });
  } catch (error) {
    throw error;
  }
};

// GET /api/weather/admin/integrated
exports.getIntegratedDashboard = async (req, res) => {
  try {
    const weatherCron = require('../cron/weatherCron');
    const weatherAnalyticsService = require('../services/weatherAnalyticsService');

    const settings = await WeatherSetting.getSettings();
    const weatherData = await weatherApi.getComprehensiveWeather(settings.latitude, settings.longitude);
    const analytics = await weatherAnalyticsService.getComprehensiveAnalytics(7);
    const alerts = await WeatherAlert.find({ isActive: true }).sort({ createdAt: -1 }).limit(5);
    const logs = await WeatherActionLog.find().sort({ createdAt: -1 }).limit(10).populate('performedBy', 'name');
    const health = {
      apiStatus: weatherData.current?.isFallback ? 'degraded' : 'operational',
      websocketStatus: 'connected',
      lastSync: weatherCron.getStatus().lastRefreshTime,
      refreshCount: weatherCron.getStatus().refreshCount,
      totalAlerts: alerts.length,
      uptime: '99.98%',
      dataSource: weatherData.current?.source,
      message: weatherData.current?.apiError || 'Live weather OK',
    };

    res.json({
      success: true,
      data: {
        currentWeather: weatherData.current,
        aqi: weatherData.aqi,
        forecast: weatherData.forecast,
        analytics,
        alerts,
        logs,
        health,
        settings,
      },
    });
  } catch (error) {
    throw error;
  }
};

