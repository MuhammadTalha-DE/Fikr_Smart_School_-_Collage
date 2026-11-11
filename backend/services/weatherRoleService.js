const weatherApi = require('./weatherApiService');
const WeatherAlert = require('../models/WeatherAlert');
const WeatherHistory = require('../models/WeatherHistory');

/**
 * Weather Role Service
 * Provides role-specific weather summaries and advice
 */

class WeatherRoleService {
  /**
   * Generate student weather summary
   */
  async getStudentSummary() {
    const current = await weatherApi.getCurrentWeather();
    const aqi = await weatherApi.getAQI();
    const alerts = await WeatherAlert.find({
      isActive: true,
      targetRoles: { $in: ['student', 'all'] },
    }).sort({ createdAt: -1 }).limit(3);

    return {
      current,
      aqi,
      alerts,
      outdoorActivity: this.getOutdoorActivityStatus(current, aqi),
      safetySuggestion: this.getStudentSafetySuggestion(current, aqi),
      transportNotice: this.getTransportNotice(current),
    };
  }

  /**
   * Generate teacher weather summary
   */
  async getTeacherSummary() {
    const current = await weatherApi.getCurrentWeather();
    const aqi = await weatherApi.getAQI();
    const forecast = await weatherApi.getForecast();
    const alerts = await WeatherAlert.find({
      isActive: true,
      targetRoles: { $in: ['teacher', 'all'] },
    }).sort({ createdAt: -1 }).limit(3);

    const todayForecast = forecast.slice(0, 4); // Next 12 hours

    return {
      current,
      aqi,
      todayForecast,
      alerts,
      outdoorClassSuitability: this.getOutdoorClassSuitability(current),
      sportsAdvice: this.getSportsActivityAdvice(current),
      examAdvice: this.getExamDayAdvice(current),
      classroomComfort: this.getClassroomComfort(current),
    };
  }

  /**
   * Generate parent weather summary
   */
  async getParentSummary() {
    const current = await weatherApi.getCurrentWeather();
    const aqi = await weatherApi.getAQI();
    const alerts = await WeatherAlert.find({
      isActive: true,
      targetRoles: { $in: ['parent', 'all'] },
    }).sort({ createdAt: -1 }).limit(3);

    return {
      current,
      aqi,
      alerts,
      childSafetyAdvice: this.getParentSafetyAdvice(current, aqi),
      transportStatus: this.getParentTransportStatus(current),
      emergencyNotice: alerts.length > 0 ? alerts[0] : null,
    };
  }

  /**
   * Generate hostel weather summary
   */
  async getHostelSummary() {
    const current = await weatherApi.getCurrentWeather();
    const aqi = await weatherApi.getAQI();
    const alerts = await WeatherAlert.find({
      isActive: true,
      targetRoles: { $in: ['hostel', 'all'] },
    }).sort({ createdAt: -1 }).limit(3);

    return {
      current,
      aqi,
      alerts,
      environmentStatus: this.getHostelEnvironmentStatus(current),
      healthAdvice: this.getHostelHealthAdvice(current, aqi),
      nightSafety: this.getNightSafetyStatus(current),
    };
  }

  /**
   * Generate transport weather summary
   */
  async getTransportSummary() {
    const current = await weatherApi.getCurrentWeather();
    const alerts = await WeatherAlert.find({
      isActive: true,
      targetRoles: { $in: ['transport', 'all'] },
    }).sort({ createdAt: -1 }).limit(3);

    return {
      current,
      alerts,
      routeRisk: this.getRouteRiskAssessment(current),
      driverAdvisory: this.getDriverAdvisory(current),
      parentDelayAlert: this.getParentDelayInfo(current),
      routeSafetyStatus: this.getRouteSafetyStatus(current),
    };
  }

  // ─── HELPER METHODS ──────────────────────────────────────────

  getOutdoorActivityStatus(weather, aqi) {
    const temp = weather.temperature;
    const condition = (weather.condition || '').toLowerCase();
    const aqiLevel = aqi?.aqi || 1;

    if (temp >= 38 || aqiLevel >= 4) {
      return { status: 'not_recommended', label: 'Not Recommended', color: 'red', message: 'Stay indoors. Extreme conditions detected.' };
    }
    if (temp >= 35 || aqiLevel >= 3 || condition.includes('rain') || condition.includes('storm')) {
      return { status: 'caution', label: 'Caution', color: 'amber', message: 'Limit outdoor activities. Take necessary precautions.' };
    }
    return { status: 'safe', label: 'Safe', color: 'green', message: 'Weather is suitable for outdoor activities.' };
  }

  getStudentSafetySuggestion(weather, aqi) {
    const suggestions = [];
    const temp = weather.temperature;
    const condition = (weather.condition || '').toLowerCase();

    if (temp >= 38) suggestions.push('🔴 Extreme heat - Stay hydrated, avoid sun exposure');
    else if (temp >= 35) suggestions.push('🟡 Hot day - Carry water, wear sunscreen');
    else if (temp <= 10) suggestions.push('🔵 Cold day - Wear warm clothes');
    else if (temp <= 5) suggestions.push('🔵 Very cold - Wear heavy jacket');

    if (condition.includes('rain')) suggestions.push('🌧️ Carry an umbrella today');
    if (condition.includes('fog') || weather.visibility < 3) suggestions.push('🌁 Low visibility - Be careful on your way to school');
    if (aqi?.aqi >= 4) suggestions.push('😷 Poor AQI - Wear a mask outdoors');
    else if (aqi?.aqi >= 3) suggestions.push('💨 Moderate AQI - Limit intense outdoor exercise');

    return suggestions.length > 0 ? suggestions : ['✅ Weather is clear - No special precautions needed'];
  }

  getTransportNotice(weather) {
    const condition = (weather.condition || '').toLowerCase();
    const visibility = weather.visibility;

    if (condition.includes('fog') || condition.includes('rain') || condition.includes('storm')) {
      return { hasDelay: true, message: 'Transport may be delayed due to weather conditions.', risk: 'medium' };
    }
    if (visibility < 3) {
      return { hasDelay: true, message: 'Low visibility may affect transport schedules.', risk: 'high' };
    }
    return { hasDelay: false, message: 'No transport delays expected.', risk: 'low' };
  }

  getOutdoorClassSuitability(weather) {
    const temp = weather.temperature;
    const condition = (weather.condition || '').toLowerCase();

    if (temp >= 38 || temp <= 5 || condition.includes('storm') || condition.includes('heavy rain')) {
      return { suitable: false, label: 'Not Suitable', message: 'Outdoor classes are not recommended today.' };
    }
    if (temp >= 35 || temp <= 10 || condition.includes('rain') || condition.includes('fog')) {
      return { suitable: false, label: 'Limited', message: 'Outdoor classes are possible with precautions.' };
    }
    return { suitable: true, label: 'Suitable', message: 'Perfect conditions for outdoor classes.' };
  }

  getSportsActivityAdvice(weather) {
    const temp = weather.temperature;
    const wind = weather.windSpeed;
    const condition = (weather.condition || '').toLowerCase();

    if (temp >= 38 || wind > 35 || condition.includes('storm')) {
      return { allowed: false, message: '⛔ All sports activities canceled due to extreme weather.' };
    }
    if (temp >= 35 || wind > 25 || condition.includes('rain')) {
      return { allowed: false, message: '⚠️ Outdoor sports not recommended. Consider indoor alternatives.' };
    }
    if (temp >= 30) {
      return { allowed: true, message: '⚠️ Sports allowed but with extra hydration breaks.' };
    }
    return { allowed: true, message: '✅ Sports activities can proceed as normal.' };
  }

  getExamDayAdvice(weather) {
    const condition = (weather.condition || '').toLowerCase();
    if (condition.includes('storm') || condition.includes('heavy rain')) {
      return { caution: true, message: '⛈️ Severe weather on exam day. Consider contingency plans.' };
    }
    return { caution: false, message: 'Weather is suitable for exams.' };
  }

  getClassroomComfort(weather) {
    const temp = weather.temperature;
    const humidity = weather.humidity;

    if (temp >= 35) return { comfortable: false, message: '🔥 Classrooms may be hot. Ensure fans/AC are working.' };
    if (humidity > 80) return { comfortable: false, message: '💧 High humidity. Check classroom ventilation.' };
    if (temp <= 10) return { comfortable: false, message: '❄️ Classrooms may be cold. Ensure heating is available.' };
    return { comfortable: true, message: '✅ Classroom conditions are comfortable.' };
  }

  getParentSafetyAdvice(weather, aqi) {
    const advice = [];
    const condition = (weather.condition || '').toLowerCase();
    const temp = weather.temperature;

    if (condition.includes('rain')) advice.push('🌧️ Ensure your child carries an umbrella to school.');
    if (condition.includes('fog') || weather.visibility < 3) advice.push('🌁 Fog expected. Transport may be delayed.');
    if (temp >= 38) advice.push('🔥 Heat warning! Pack extra water for your child.');
    if (temp <= 5) advice.push('❄️ Cold weather - dress your child warmly.');
    if (aqi?.aqi >= 4) advice.push('😷 Poor air quality - send your child with a mask.');

    return advice.length > 0 ? advice : ['✅ No weather-related precautions needed today.'];
  }

  getParentTransportStatus(weather) {
    const condition = (weather.condition || '').toLowerCase();
    const visibility = weather.visibility;

    if (condition.includes('fog') || visibility < 2) {
      return { status: 'delayed', message: '🚌 Bus routes may be delayed due to low visibility.' };
    }
    if (condition.includes('rain') || condition.includes('storm')) {
      return { status: 'caution', message: '🚌 Buses running but with caution due to rain.' };
    }
    return { status: 'normal', message: '🚌 Transport is operating normally.' };
  }

  getHostelEnvironmentStatus(weather) {
    const temp = weather.temperature;
    const humidity = weather.humidity;

    if (temp >= 38) return { status: 'critical', message: '🔥 Extreme heat in hostel. Ensure all cooling systems operational.' };
    if (humidity > 80) return { status: 'warning', message: '💧 High humidity. Improve ventilation in rooms.' };
    if (temp <= 5) return { status: 'warning', message: '❄️ Cold conditions. Ensure adequate bedding.' };
    return { status: 'normal', message: '✅ Hostel environment is comfortable.' };
  }

  getHostelHealthAdvice(weather, aqi) {
    const advice = [];
    const humidity = weather.humidity;
    const temp = weather.temperature;

    if (humidity > 80) advice.push('High humidity can cause breathing issues. Keep rooms ventilated.');
    if (temp >= 38) advice.push('Risk of heat exhaustion. Ensure students stay hydrated.');
    if (temp <= 5) advice.push('Risk of cold and flu. Keep students warm and dry.');
    if (aqi?.aqi >= 4) advice.push('Poor AQI. Keep windows closed, use air purifiers if available.');
    if (aqi?.aqi >= 3) advice.push('Moderate AQI. Sensitive students should limit outdoor time.');

    return advice.length > 0 ? advice : ['No health concerns related to weather.'];
  }

  getNightSafetyStatus(weather) {
    const temp = weather.temperature;
    const condition = (weather.condition || '').toLowerCase();

    if (temp >= 35) return { alert: true, message: 'Hot night - ensure fans/AC running in all rooms.' };
    if (temp <= 5) return { alert: true, message: 'Cold night - extra blankets distributed to students.' };
    if (condition.includes('storm') || condition.includes('heavy rain')) {
      return { alert: true, message: 'Stormy night - students should stay indoors.' };
    }
    return { alert: false, message: 'Safe night conditions.' };
  }

  getRouteRiskAssessment(weather) {
    const condition = (weather.condition || '').toLowerCase();
    const visibility = weather.visibility;
    const windSpeed = weather.windSpeed;

    if (condition.includes('fog') || visibility < 2 || windSpeed > 35) return { risk: 'high', message: '⚠️ High risk - Consider delaying routes if possible.' };
    if (condition.includes('rain') || condition.includes('storm') || visibility < 5 || windSpeed > 25) {
      return { risk: 'medium', message: '⚠️ Moderate risk - Drive with caution.' };
    }
    return { risk: 'low', message: '✅ Low risk - Normal driving conditions.' };
  }

  getDriverAdvisory(weather) {
    const advisories = [];
    const condition = (weather.condition || '').toLowerCase();
    const visibility = weather.visibility;
    const windSpeed = weather.windSpeed;

    if (condition.includes('rain')) advisories.push('Reduce speed on wet roads.');
    if (condition.includes('fog') || visibility < 3) advisories.push('Use fog lights. Maintain safe distance.');
    if (windSpeed > 25) advisories.push('Watch for crosswinds on open roads.');
    if (visibility < 1) advisories.push('⚠️ Extreme low visibility - Consider stopping if unsafe.');

    return advisories.length > 0 ? advisories : ['Normal driving conditions. Follow regular routes.'];
  }

  getParentDelayInfo(weather) {
    const condition = (weather.condition || '').toLowerCase();
    const visibility = weather.visibility;

    if (condition.includes('fog') || visibility < 2) {
      return { shouldNotify: true, estimatedDelay: '15-30 minutes', reason: 'Low visibility' };
    }
    if (condition.includes('heavy rain') || condition.includes('storm')) {
      return { shouldNotify: true, estimatedDelay: '10-20 minutes', reason: 'Adverse weather' };
    }
    return { shouldNotify: false, estimatedDelay: 'None', reason: 'Clear conditions' };
  }

  getRouteSafetyStatus(weather) {
    const condition = (weather.condition || '').toLowerCase();
    const visibility = weather.visibility;

    if (condition.includes('fog') || condition.includes('storm') || visibility < 2) {
      return { status: 'unsafe', message: 'Route conditions unsafe. Consider alternative or delay.' };
    }
    if (condition.includes('rain') || visibility < 5) {
      return { status: 'caution', message: 'Route conditions require caution.' };
    }
    return { status: 'safe', message: 'All routes clear and safe.' };
  }
}

module.exports = new WeatherRoleService();
