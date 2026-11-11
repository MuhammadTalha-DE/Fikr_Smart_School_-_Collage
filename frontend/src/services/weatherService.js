import api from './api';

/**
 * Weather API Service
 * All weather-related API calls for the Fikr Weather Intelligence Subsystem
 */

// ─── PUBLIC / ROLE-BASED ────────────────────────────────────────

export const getCurrentWeather = (params = {}) =>
  api.get('/weather/current', { params });

export const getForecast = (params = {}) =>
  api.get('/weather/forecast', { params });

export const getHourlyForecast = (params = {}) =>
  api.get('/weather/hourly', { params });

export const getWeeklyForecast = (params = {}) =>
  api.get('/weather/weekly', { params });

export const getAQI = (params = {}) =>
  api.get('/weather/aqi', { params });

export const getWeatherAlerts = () =>
  api.get('/weather/alerts');

export const getWeatherRoleSummary = () =>
  api.get('/weather/role-summary');

// ─── ADMIN ──────────────────────────────────────────────────────

export const getAdminWeatherDashboard = () =>
  api.get('/weather/admin/dashboard');

export const getWeatherAnalytics = (params = {}) =>
  api.get('/weather/admin/analytics', { params });

export const getWeatherHistory = (params = {}) =>
  api.get('/weather/admin/history', { params });

export const getWeatherSystemHealth = () =>
  api.get('/weather/admin/system-health');

export const refreshWeatherData = () =>
  api.post('/weather/admin/refresh');

export const createWeatherAlert = (data) =>
  api.post('/weather/admin/alerts', data);

export const getWeatherSettings = () =>
  api.get('/weather/admin/settings');

export const updateWeatherSettings = (data) =>
  api.put('/weather/admin/settings', data);

export const resolveWeatherAlert = (id) =>
  api.delete(`/weather/admin/alerts/${id}`);

export const getWeatherActionLogs = (params = {}) =>
  api.get('/weather/admin/logs', { params });

// ─── ROLE-SPECIFIC ──────────────────────────────────────────────

export const getStudentWeatherSummary = () =>
  api.get('/weather/student/summary');

export const getTeacherWeatherSummary = () =>
  api.get('/weather/teacher/summary');

export const getParentWeatherSummary = () =>
  api.get('/weather/parent/summary');

export const getHostelWeatherSummary = () =>
  api.get('/weather/hostel/summary');

export const getTransportWeatherSummary = () =>
  api.get('/weather/transport/summary');

export const getWeatherImpactAnalytics = (params = {}) =>
  api.get('/weather/analytics/impact', { params });

export const getWeatherAttendanceCorrelation = (params = {}) =>
  api.get('/weather/analytics/attendance-correlation', { params });

export const getWeatherTransportCorrelation = (params = {}) =>
  api.get('/weather/analytics/transport-correlation', { params });

export const getWeatherHostelCorrelation = (params = {}) =>
  api.get('/weather/analytics/hostel-correlation', { params });

export const getWeatherReportExport = (params = {}) =>
  api.get('/weather/admin/export', { params });

export const getWeatherCronStatus = () =>
  api.get('/weather/admin/cron-status');

export const forceWeatherSync = () =>
  api.post('/weather/admin/force-refresh');

export const getIntegratedWeatherDashboard = () =>
  api.get('/weather/admin/integrated');
