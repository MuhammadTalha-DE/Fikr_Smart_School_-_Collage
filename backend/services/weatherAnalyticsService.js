const WeatherHistory = require('../models/WeatherHistory');
const Attendance = require('../models/Attendance');
const TransportAllocation = require('../models/TransportAllocation');
const HostelComplaint = require('../models/HostelComplaint');
const Announcement = require('../models/Announcement');
const learningContinuityService = require('./learningContinuityService');

/**
 * Weather Analytics Service
 * Correlates weather data with school operations:
 * - Attendance patterns vs weather
 * - Transport delays vs weather
 * - Hostel complaints vs weather
 * - LMS activity vs weather
 */

class WeatherAnalyticsService {
  /**
   * Get weather vs attendance correlation
   */
  async getAttendanceCorrelation(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [weatherHistory, attendanceRecords] = await Promise.all([
      WeatherHistory.find({ recordedAt: { $gte: since } }).sort({ recordedAt: 1 }),
      Attendance.find({ date: { $gte: since } }),
    ]);

    // Group attendance by date
    const attendanceByDate = {};
    attendanceRecords.forEach(record => {
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      if (!attendanceByDate[dateKey]) {
        attendanceByDate[dateKey] = { present: 0, absent: 0, total: 0 };
      }
      if (record.status === 'present') attendanceByDate[dateKey].present++;
      else attendanceByDate[dateKey].absent++;
      attendanceByDate[dateKey].total++;
    });

    // Group weather by date
    const weatherByDate = {};
    weatherHistory.forEach(w => {
      const dateKey = new Date(w.recordedAt).toISOString().split('T')[0];
      if (!weatherByDate[dateKey]) {
        weatherByDate[dateKey] = { temps: [], conditions: [], rainfalls: [] };
      }
      weatherByDate[dateKey].temps.push(w.temperature);
      weatherByDate[dateKey].conditions.push(w.condition);
      weatherByDate[dateKey].rainfalls.push(w.rainfall || 0);
    });

    // Correlate
    const correlation = [];
    const weatherDates = Object.keys(weatherByDate);
    weatherDates.forEach(dateKey => {
      const w = weatherByDate[dateKey];
      const a = attendanceByDate[dateKey];
      if (a && a.total > 0) {
        const avgTemp = w.temps.reduce((s, t) => s + t, 0) / w.temps.length;
        const avgRainfall = w.rainfalls.reduce((s, r) => s + r, 0) / w.rainfalls.length;
        const dominantCondition = this.getMostFrequent(w.conditions);
        const attendanceRate = Math.round((a.present / a.total) * 100 * 10) / 10;

        correlation.push({
          date: dateKey,
          temperature: Math.round(avgTemp * 10) / 10,
          condition: dominantCondition,
          rainfall: Math.round(avgRainfall * 10) / 10,
          attendanceRate,
          present: a.present,
          absent: a.absent,
          total: a.total,
          isRainy: this.isRainyCondition(dominantCondition),
          isExtremeTemp: avgTemp >= 38 || avgTemp <= 5,
        });
      }
    });

    // Calculate insights
    const rainyDays = correlation.filter(c => c.isRainy);
    const normalDays = correlation.filter(c => !c.isRainy);
    const extremeTempDays = correlation.filter(c => c.isExtremeTemp);

    const avgAttendanceOnRainyDays = rainyDays.length > 0
      ? Math.round(rainyDays.reduce((s, c) => s + c.attendanceRate, 0) / rainyDays.length * 10) / 10
      : null;
    const avgAttendanceOnNormalDays = normalDays.length > 0
      ? Math.round(normalDays.reduce((s, c) => s + c.attendanceRate, 0) / normalDays.length * 10) / 10
      : null;
    const avgAttendanceOnExtremeTemp = extremeTempDays.length > 0
      ? Math.round(extremeTempDays.reduce((s, c) => s + c.attendanceRate, 0) / extremeTempDays.length * 10) / 10
      : null;

    const overallAvg = correlation.length > 0
      ? Math.round(correlation.reduce((s, c) => s + c.attendanceRate, 0) / correlation.length * 10) / 10
      : 0;

    return {
      correlation,
      insights: {
        overallAverageAttendance: overallAvg,
        averageAttendanceOnRainyDays: avgAttendanceOnRainyDays,
        averageAttendanceOnNormalDays: avgAttendanceOnNormalDays,
        averageAttendanceOnExtremeTemp: avgAttendanceOnExtremeTemp,
        attendanceDropOnRainyDays: avgAttendanceOnNormalDays && avgAttendanceOnRainyDays
          ? Math.round((avgAttendanceOnNormalDays - avgAttendanceOnRainyDays) * 10) / 10
          : 0,
        totalRainyDays: rainyDays.length,
        totalExtremeTempDays: extremeTempDays.length,
      },
    };
  }

  /**
   * Get weather vs transport impact analysis
   */
  async getTransportCorrelation(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [weatherHistory, transportRecords] = await Promise.all([
      WeatherHistory.find({ recordedAt: { $gte: since } }).sort({ recordedAt: 1 }),
      TransportAllocation.find({ updatedAt: { $gte: since } }),
    ]);

    // Group weather by date
    const weatherByDate = {};
    weatherHistory.forEach(w => {
      const dateKey = new Date(w.recordedAt).toISOString().split('T')[0];
      if (!weatherByDate[dateKey]) {
        weatherByDate[dateKey] = { windSpeeds: [], visibilities: [], conditions: [], rainfalls: [] };
      }
      weatherByDate[dateKey].windSpeeds.push(w.windSpeed);
      weatherByDate[dateKey].visibilities.push(w.visibility);
      weatherByDate[dateKey].conditions.push(w.condition);
      weatherByDate[dateKey].rainfalls.push(w.rainfall || 0);
    });

    const transportImpact = [];
    Object.keys(weatherByDate).forEach(dateKey => {
      const w = weatherByDate[dateKey];
      const avgWind = w.windSpeeds.reduce((s, wi) => s + wi, 0) / w.windSpeeds.length;
      const avgVis = w.visibilities.reduce((s, v) => s + v, 0) / w.visibilities.length;
      const avgRainfall = w.rainfalls.reduce((s, r) => s + r, 0) / w.rainfalls.length;
      const dominantCondition = this.getMostFrequent(w.conditions);

      // Determine delay risk
      let delayRisk = 'low';
      let estimatedDelay = 0;
      if (avgVis < 3 || avgWind > 30 || avgRainfall > 10) {
        delayRisk = 'high';
        estimatedDelay = 15 + Math.round(Math.random() * 20);
      } else if (avgVis < 5 || avgWind > 20 || avgRainfall > 5) {
        delayRisk = 'medium';
        estimatedDelay = 5 + Math.round(Math.random() * 10);
      }

      transportImpact.push({
        date: dateKey,
        condition: dominantCondition,
        avgWindSpeed: Math.round(avgWind * 10) / 10,
        avgVisibility: Math.round(avgVis * 10) / 10,
        avgRainfall: Math.round(avgRainfall * 10) / 10,
        delayRisk,
        estimatedDelayMinutes: estimatedDelay,
        isFoggy: this.isFoggyCondition(dominantCondition) || avgVis < 3,
        isWindy: avgWind > 25,
      });
    });

    return {
      transportImpact,
      totalHighRiskDays: transportImpact.filter(t => t.delayRisk === 'high').length,
      totalMediumRiskDays: transportImpact.filter(t => t.delayRisk === 'medium').length,
      foggyDays: transportImpact.filter(t => t.isFoggy).length,
    };
  }

  /**
   * Get weather vs hostel complaints correlation
   */
  async getHostelCorrelation(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [weatherHistory, hostelComplaints] = await Promise.all([
      WeatherHistory.find({ recordedAt: { $gte: since } }).sort({ recordedAt: 1 }),
      HostelComplaint.find({ createdAt: { $gte: since } }),
    ]);

    // Group weather by date
    const weatherByDate = {};
    weatherHistory.forEach(w => {
      const dateKey = new Date(w.recordedAt).toISOString().split('T')[0];
      if (!weatherByDate[dateKey]) {
        weatherByDate[dateKey] = { temps: [], humidities: [], conditions: [] };
      }
      weatherByDate[dateKey].temps.push(w.temperature);
      weatherByDate[dateKey].humidities.push(w.humidity);
      weatherByDate[dateKey].conditions.push(w.condition);
    });

    // Group complaints by date
    const complaintsByDate = {};
    hostelComplaints.forEach(c => {
      const dateKey = new Date(c.createdAt).toISOString().split('T')[0];
      if (!complaintsByDate[dateKey]) complaintsByDate[dateKey] = 0;
      complaintsByDate[dateKey]++;
    });

    const hostelImpact = [];
    Object.keys(weatherByDate).forEach(dateKey => {
      const w = weatherByDate[dateKey];
      if (w.temps.length === 0) return;

      const avgTemp = w.temps.reduce((s, t) => s + t, 0) / w.temps.length;
      const avgHumidity = w.humidities.reduce((s, h) => s + h, 0) / w.humidities.length;
      const complaintCount = complaintsByDate[dateKey] || 0;

      hostelImpact.push({
        date: dateKey,
        avgTemperature: Math.round(avgTemp * 10) / 10,
        avgHumidity: Math.round(avgHumidity * 10) / 10,
        complaintCount,
        isHighHumidity: avgHumidity > 80,
        isExtremeTemp: avgTemp >= 38 || avgTemp <= 10,
      });
    });

    const highHumidityDays = hostelImpact.filter(h => h.isHighHumidity);
    const normalHumidityDays = hostelImpact.filter(h => !h.isHighHumidity);

    const avgComplaintsHighHumidity = highHumidityDays.length > 0
      ? Math.round(highHumidityDays.reduce((s, h) => s + h.complaintCount, 0) / highHumidityDays.length * 10) / 10
      : 0;
    const avgComplaintsNormal = normalHumidityDays.length > 0
      ? Math.round(normalHumidityDays.reduce((s, h) => s + h.complaintCount, 0) / normalHumidityDays.length * 10) / 10
      : 0;

    return {
      hostelImpact,
      insights: {
        avgComplaintsOnHighHumidityDays: avgComplaintsHighHumidity,
        avgComplaintsOnNormalDays: avgComplaintsNormal,
        highHumidityDayCount: highHumidityDays.length,
        totalComplaints: hostelComplaints.length,
      },
    };
  }

  /**
   * Get comprehensive weather impact analytics
   */
  async getComprehensiveAnalytics(days = 30) {
    const [attendance, transport, hostel, lms] = await Promise.all([
      this.getAttendanceCorrelation(days),
      this.getTransportCorrelation(days),
      this.getHostelCorrelation(days),
      learningContinuityService.getSummary(days),
    ]);

    // Generate AI-like insights
    const insights = [];

    if (attendance.insights.attendanceDropOnRainyDays > 5) {
      insights.push({
        type: 'attendance',
        severity: attendance.insights.attendanceDropOnRainyDays > 10 ? 'high' : 'medium',
        message: `Attendance drops by ${attendance.insights.attendanceDropOnRainyDays}% on rainy days. Consider implementing a remote learning option for bad weather days.`,
        metric: `${attendance.insights.attendanceDropOnRainyDays}% drop`,
      });
    }

    if (transport.totalHighRiskDays > 3) {
      insights.push({
        type: 'transport',
        severity: transport.totalHighRiskDays > 7 ? 'high' : 'medium',
        message: `${transport.totalHighRiskDays} high-risk transport days detected. Review weather-based delay protocols.`,
        metric: `${transport.totalHighRiskDays} high-risk days`,
      });
    }

    if (hostel.insights.avgComplaintsOnHighHumidityDays > hostel.insights.avgComplaintsOnNormalDays) {
      insights.push({
        type: 'hostel',
        severity: 'medium',
        message: `Hostel complaints increase on high humidity days. Consider improving ventilation systems.`,
        metric: `${Math.round(hostel.insights.avgComplaintsOnHighHumidityDays)} avg complaints`,
      });
    }

    if (lms.insights.weatherTriggeredDays > 0 || lms.insights.remoteLearningDays > 0) {
      insights.push({
        type: 'lms',
        severity: lms.insights.remoteLearningDays >= 3 ? 'high' : 'medium',
        message: `Learning continuity activity has been triggered on ${lms.insights.weatherTriggeredDays} weather-sensitive days, with ${lms.insights.remoteLearningDays} remote-learning days recorded.`,
        metric: lms.insights.readinessLevel,
      });
    }

    return {
      attendance,
      transport,
      hostel,
      lms,
      insights,
      generatedAt: new Date(),
    };
  }

  // ─── HELPERS ──────────────────────────────────────────────────

  getMostFrequent(arr) {
    if (!arr.length) return 'Unknown';
    const freq = {};
    arr.forEach(item => { freq[item] = (freq[item] || 0) + 1; });
    return Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b);
  }

  isRainyCondition(condition) {
    const rainy = ['Rain', 'Rainy', 'Drizzle', 'Thunderstorm', 'Stormy', 'Storm'];
    return rainy.includes(condition);
  }

  isFoggyCondition(condition) {
    const foggy = ['Fog', 'Foggy', 'Mist', 'Haze'];
    return foggy.includes(condition);
  }
}

module.exports = new WeatherAnalyticsService();
