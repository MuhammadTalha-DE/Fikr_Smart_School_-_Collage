/**
 * Backend Weather Helper Utilities
 */

/**
 * Get AQI label from API value (1-5 scale)
 */
const getAQLabel = (aqi) => {
  const levels = {
    1: 'Good',
    2: 'Fair',
    3: 'Moderate',
    4: 'Poor',
    5: 'Very Poor',
  };
  return levels[aqi] || 'Unknown';
};

/**
 * Get severity from numeric AQI
 */
const getAQISeverity = (aqi) => {
  if (aqi <= 50) return { level: 'good', color: 'green' };
  if (aqi <= 100) return { level: 'moderate', color: 'yellow' };
  if (aqi <= 150) return { level: 'unhealthy-sensitive', color: 'orange' };
  if (aqi <= 200) return { level: 'unhealthy', color: 'red' };
  if (aqi <= 300) return { level: 'very-unhealthy', color: 'purple' };
  return { level: 'hazardous', color: 'maroon' };
};

/**
 * Get weather condition severity
 */
const getConditionSeverity = (condition) => {
  const severe = ['Thunderstorm', 'Stormy', 'Heavy Rain', 'Blizzard', 'Tornado'];
  const moderate = ['Rain', 'Rainy', 'Snow', 'Fog', 'Mist', 'Haze'];
  
  if (severe.includes(condition)) return 'high';
  if (moderate.includes(condition)) return 'medium';
  return 'low';
};

/**
 * Format weather data for charting
 */
const formatForChart = (history) => {
  return history.map(h => ({
    time: h.recordedAt,
    temperature: h.temperature,
    humidity: h.humidity,
    windSpeed: h.windSpeed,
    pressure: h.pressure,
    condition: h.condition,
    rainfall: h.rainfall || 0,
  }));
};

/**
 * Calculate weather statistics from history
 */
const calculateStats = (history) => {
  if (!history.length) return null;

  const temps = history.map(h => h.temperature);
  const humidities = history.map(h => h.humidity);
  const windSpeeds = history.map(h => h.windSpeed);

  return {
    avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length * 10) / 10,
    maxTemp: Math.round(Math.max(...temps)),
    minTemp: Math.round(Math.min(...temps)),
    avgHumidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
    avgWindSpeed: Math.round(windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length * 10) / 10,
    tempRange: Math.round(Math.max(...temps) - Math.min(...temps)),
  };
};

module.exports = {
  getAQLabel,
  getAQISeverity,
  getConditionSeverity,
  formatForChart,
  calculateStats,
};
