/**
 * Weather Utility Helpers
 * Shared helpers for weather data formatting, icons, and calculations
 */

// ─── ICON MAPPING ───────────────────────────────────────────────

export const weatherIcons = {
  Sunny: { icon: '☀️', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  Clear: { icon: '☀️', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  'Partly Cloudy': { icon: '⛅', color: 'text-blue-300', bg: 'bg-blue-300/10' },
  Cloudy: { icon: '☁️', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  Overcast: { icon: '☁️', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  Rainy: { icon: '🌧️', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  Rain: { icon: '🌧️', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  Drizzle: { icon: '🌦️', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  Stormy: { icon: '⛈️', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  Thunderstorm: { icon: '⛈️', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  Snowy: { icon: '❄️', color: 'text-blue-200', bg: 'bg-blue-200/10' },
  Snow: { icon: '❄️', color: 'text-blue-200', bg: 'bg-blue-200/10' },
  Foggy: { icon: '🌫️', color: 'text-gray-300', bg: 'bg-gray-300/10' },
  Mist: { icon: '🌫️', color: 'text-gray-300', bg: 'bg-gray-300/10' },
  Fog: { icon: '🌫️', color: 'text-gray-300', bg: 'bg-gray-300/10' },
  Haze: { icon: '🌫️', color: 'text-amber-300', bg: 'bg-amber-300/10' },
  Windy: { icon: '💨', color: 'text-sky-300', bg: 'bg-sky-300/10' },
};

export const getWeatherIcon = (condition) =>
  weatherIcons[condition] || { icon: '🌤️', color: 'text-blue-400', bg: 'bg-blue-400/10' };

// ─── AQI HELPERS ────────────────────────────────────────────────

export const aqiLevels = [
  { max: 50, label: 'Good', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', gauge: 'from-emerald-400' },
  { max: 100, label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', gauge: 'from-yellow-400' },
  { max: 150, label: 'Unhealthy for Sensitive', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', gauge: 'from-orange-400' },
  { max: 200, label: 'Unhealthy', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', gauge: 'from-red-400' },
  { max: 300, label: 'Very Unhealthy', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', gauge: 'from-purple-400' },
  { max: 500, label: 'Hazardous', color: 'text-rose-400', bg: 'bg-rose-900/10', border: 'border-rose-900/30', gauge: 'from-rose-900' },
];

export const getAQIInfo = (aqi) => {
  if (aqi == null) return aqiLevels[0];
  return aqiLevels.find((level) => aqi <= level.max) || aqiLevels[aqiLevels.length - 1];
};

// ─── WEATHER CONDITION HELPERS ──────────────────────────────────

export const isRainy = (condition) =>
  ['Rain', 'Rainy', 'Drizzle', 'Thunderstorm', 'Stormy'].includes(condition);

export const isFoggy = (condition, visibility) =>
  ['Fog', 'Foggy', 'Mist', 'Haze'].includes(condition) || (visibility != null && visibility < 3);

export const isHot = (temp) => temp >= 35;
export const isVeryHot = (temp) => temp >= 38;
export const isCold = (temp) => temp <= 10;
export const isVeryCold = (temp) => temp <= 5;

export const isWindy = (windSpeed) => windSpeed > 25;
export const isVeryWindy = (windSpeed) => windSpeed > 35;

// ─── FORMATTING HELPERS ─────────────────────────────────────────

export const formatTemp = (temp) => `${Math.round(temp)}°C`;
export const formatWind = (speed) => `${speed} km/h`;
export const formatVisibility = (km) => `${km} km`;
export const formatPressure = (hpa) => `${hpa} hPa`;
export const formatHumidity = (h) => `${h}%`;

export const getWindDirection = (degrees) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export const getUVLevel = (uvIndex) => {
  if (uvIndex <= 2) return { label: 'Low', color: 'text-green-400' };
  if (uvIndex <= 5) return { label: 'Moderate', color: 'text-yellow-400' };
  if (uvIndex <= 7) return { label: 'High', color: 'text-orange-400' };
  if (uvIndex <= 10) return { label: 'Very High', color: 'text-red-400' };
  return { label: 'Extreme', color: 'text-purple-400' };
};

export const getTimeFromTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const getDayFromDate = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};
