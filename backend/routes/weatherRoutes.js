const express = require('express');
const router = express.Router();
const {
  getCurrentWeather,
  getForecast,
  getHourlyForecast,
  getWeeklyForecast,
  getAQI,
  getActiveAlerts,
  getRoleSummary,
  getAdminDashboard,
  getAnalytics,
  getHistory,
  getSystemHealth,
  refreshWeather,
  createAlert,
  getSettings,
  updateSettings,
  resolveAlert,
  getActionLogs,
  getStudentSummary,
  getTeacherSummary,
  getParentSummary,
  getHostelSummary,
  getTransportSummary,
  getImpactAnalytics,
  getAttendanceCorrelation,
  getTransportCorrelation,
  getHostelCorrelation,
  getExportReport,
  getCronStatus,
  forceWeatherRefresh,
  getIntegratedDashboard,
} = require('../controllers/weatherController');
const { protect } = require('../middleware/authMiddleware');
const { weatherAccess } = require('../middleware/weatherAccessMiddleware');
const { cacheResponse, clearCache } = require('../middleware/cacheMiddleware');

const weatherCache = (ttlSeconds) => cacheResponse({ namespace: 'weather', ttlSeconds });

// ─── PUBLIC / ROLE-BASED ROUTES ─────────────────────────────────
router.get('/current', weatherCache(60), getCurrentWeather);
router.get('/forecast', weatherCache(300), getForecast);
router.get('/hourly', weatherCache(300), getHourlyForecast);
router.get('/weekly', weatherCache(300), getWeeklyForecast);
router.get('/aqi', weatherCache(300), getAQI);
router.get('/alerts', protect, weatherCache(60), getActiveAlerts);
router.get('/role-summary', protect, cacheResponse({ namespace: 'weather', ttlSeconds: 60, varyBy: ['role'] }), getRoleSummary);

// ─── ADMIN ROUTES ───────────────────────────────────────────────
router.get('/admin/dashboard', protect, weatherAccess(['admin']), weatherCache(60), getAdminDashboard);
router.get('/admin/analytics', protect, weatherAccess(['admin']), weatherCache(120), getAnalytics);
router.get('/admin/history', protect, weatherAccess(['admin']), weatherCache(120), getHistory);
router.get('/admin/system-health', protect, weatherAccess(['admin']), weatherCache(60), getSystemHealth);
router.post('/admin/refresh', protect, weatherAccess(['admin']), clearCache('weather'), refreshWeather);
router.post('/admin/alerts', protect, weatherAccess(['admin']), clearCache('weather'), createAlert);
router.get('/admin/settings', protect, weatherAccess(['admin']), getSettings);
router.put('/admin/settings', protect, weatherAccess(['admin']), clearCache('weather'), updateSettings);
router.delete('/admin/alerts/:id', protect, weatherAccess(['admin']), clearCache('weather'), resolveAlert);
router.get('/admin/logs', protect, weatherAccess(['admin']), weatherCache(60), getActionLogs);

// ─── ROLE-SPECIFIC ROUTES ───────────────────────────────────────
router.get('/student/summary', protect, weatherAccess(['student']), weatherCache(60), getStudentSummary);
router.get('/teacher/summary', protect, weatherAccess(['teacher']), weatherCache(60), getTeacherSummary);
router.get('/parent/summary', protect, weatherAccess(['parent']), weatherCache(60), getParentSummary);
router.get('/hostel/summary', protect, weatherAccess(['hostel', 'warden']), weatherCache(60), getHostelSummary);
router.get('/transport/summary', protect, weatherAccess(['transport']), weatherCache(60), getTransportSummary);

// ─── WEATHER IMPACT ANALYTICS (Phase 9) ────────────────────────
router.get('/analytics/impact', protect, weatherAccess(['admin']), weatherCache(300), getImpactAnalytics);
router.get('/analytics/attendance-correlation', protect, weatherAccess(['admin']), weatherCache(300), getAttendanceCorrelation);
router.get('/analytics/transport-correlation', protect, weatherAccess(['admin']), weatherCache(300), getTransportCorrelation);
router.get('/analytics/hostel-correlation', protect, weatherAccess(['admin']), weatherCache(300), getHostelCorrelation);

// ─── EXPORT / REPORT ─────────────────────────────────────────────
router.get('/admin/export', protect, weatherAccess(['admin']), weatherCache(300), getExportReport);

// ─── SYSTEM ──────────────────────────────────────────────────────
router.get('/admin/cron-status', protect, weatherAccess(['admin']), weatherCache(30), getCronStatus);
router.post('/admin/force-refresh', protect, weatherAccess(['admin']), clearCache('weather'), forceWeatherRefresh);

// ─── INTEGRATED DASHBOARD ────────────────────────────────────────
router.get('/admin/integrated', protect, weatherAccess(['admin']), weatherCache(60), getIntegratedDashboard);

module.exports = router;
