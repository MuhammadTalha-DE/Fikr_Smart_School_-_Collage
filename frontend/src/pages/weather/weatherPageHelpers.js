import {
  getAQIInfo,
  getDayFromDate,
  getWeatherIcon,
  isFoggy,
  isRainy,
  isVeryCold,
  isVeryHot,
  isVeryWindy,
} from '../../utils/weatherHelpers';

export const buildHourlyForecast = (forecast = []) =>
  forecast.slice(0, 8).map((item) => ({
    ...item,
    time: item.time || item.recordedAt,
  }));

export const buildWeeklyForecast = (forecast = []) => {
  if (!forecast.length) return [];

  const grouped = new Map();

  forecast.forEach((item) => {
    const date = new Date(item.time || item.recordedAt);
    const key = date.toISOString().split('T')[0];

    if (!grouped.has(key)) {
      grouped.set(key, {
        date: key,
        day: getDayFromDate(date),
        high: item.temperature,
        low: item.temperature,
        humidity: item.humidity || 0,
        windSpeed: item.windSpeed || 0,
        rainfall: item.rainfall || 0,
        condition: item.condition || 'Clear',
        samples: 1,
      });
      return;
    }

    const existing = grouped.get(key);
    existing.high = Math.max(existing.high, item.temperature);
    existing.low = Math.min(existing.low, item.temperature);
    existing.humidity += item.humidity || 0;
    existing.windSpeed += item.windSpeed || 0;
    existing.rainfall += item.rainfall || 0;
    existing.samples += 1;

    if ((item.rainfall || 0) > existing.rainfall) {
      existing.condition = item.condition || existing.condition;
    }
  });

  return Array.from(grouped.values())
    .slice(0, 7)
    .map((item) => ({
      ...item,
      humidity: Math.round(item.humidity / item.samples),
      windSpeed: Math.round((item.windSpeed / item.samples) * 10) / 10,
    }));
};

export const buildWeatherChartSeries = (records = []) =>
  records.map((item) => ({
    time: new Date(item.recordedAt || item.time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    temperature: Math.round(item.temperature ?? 0),
    humidity: Math.round(item.humidity ?? 0),
    wind: Math.round(item.windSpeed ?? 0),
    aqi: item.aqi ?? 0,
  }));

export const getCampusSafetyStatus = (current = {}, aqi = null, thresholds = {}) => {
  const issues = [];
  let score = 0;

  const highTemperature = thresholds.highTemperature ?? 38;
  const heavyRain = thresholds.heavyRain ?? 10;
  const strongWind = thresholds.strongWind ?? 30;
  const lowVisibility = thresholds.lowVisibility ?? 3;

  if (isVeryHot(current.temperature) || current.temperature >= highTemperature) {
    score += 2;
    issues.push('Heat stress risk');
  } else if (isVeryCold(current.temperature)) {
    score += 1;
    issues.push('Cold exposure risk');
  }

  if (isRainy(current.condition) || (current.rainfall || 0) >= heavyRain) {
    score += 1;
    issues.push('Rain disruption risk');
  }

  if (isFoggy(current.condition, current.visibility) || (current.visibility ?? 99) <= lowVisibility) {
    score += 2;
    issues.push('Low visibility on campus');
  }

  if (isVeryWindy(current.windSpeed) || (current.windSpeed || 0) >= strongWind) {
    score += 1;
    issues.push('High wind risk');
  }

  if (aqi?.aqi >= 4) {
    score += 2;
    issues.push('Poor air quality');
  } else if (aqi?.aqi === 3) {
    score += 1;
    issues.push('Moderate AQI');
  }

  if (score >= 6) {
    return {
      level: 'critical',
      label: 'Critical Risk',
      badgeClass: 'bg-red-100 text-red-700 border-red-200',
      dotClass: 'bg-red-500',
      issues,
      summary: 'Immediate weather controls and stakeholder alerts are recommended.',
    };
  }

  if (score >= 4) {
    return {
      level: 'high',
      label: 'High Risk',
      badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
      dotClass: 'bg-orange-500',
      issues,
      summary: 'Outdoor activities and travel should be reviewed before execution.',
    };
  }

  if (score >= 2) {
    return {
      level: 'moderate',
      label: 'Moderate Risk',
      badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
      issues,
      summary: 'Normal operations can continue with targeted caution notices.',
    };
  }

  return {
    level: 'safe',
    label: 'Safe',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    issues: issues.length ? issues : ['No major weather concerns'],
    summary: 'Campus conditions are favorable for regular school operations.',
  };
};

export const getWeatherHighlights = (forecast = []) => {
  if (!forecast.length) {
    return {
      hottestWindow: null,
      wettestWindow: null,
      calmestWindow: null,
    };
  }

  const hottestWindow = [...forecast].sort((a, b) => (b.temperature || 0) - (a.temperature || 0))[0];
  const wettestWindow = [...forecast].sort((a, b) => (b.rainfall || 0) - (a.rainfall || 0))[0];
  const calmestWindow = [...forecast].sort((a, b) => (a.windSpeed || 0) - (b.windSpeed || 0))[0];

  return { hottestWindow, wettestWindow, calmestWindow };
};

export const getRoleWeatherGuidance = (current = {}, aqi = null) => {
  const aqiInfo = aqi ? getAQIInfo(aqi.aqi) : null;

  return [
    {
      role: 'Students',
      text:
        current.temperature >= 35
          ? 'Hydration reminders and shaded break-time zones should be emphasized today.'
          : 'Regular class movement is fine with standard outdoor supervision.',
    },
    {
      role: 'Teachers',
      text:
        isRainy(current.condition) || (current.rainfall || 0) > 0
          ? 'Keep alternate indoor activities ready for sports and assembly periods.'
          : 'Outdoor transitions remain manageable for normal timetable flow.',
    },
    {
      role: 'Parents',
      text:
        (current.visibility || 99) < 4
          ? 'Morning travel visibility is reduced, so delay expectations should be communicated early.'
          : 'Transport conditions are stable enough for routine parent communication.',
    },
    {
      role: 'Hostel',
      text:
        (current.humidity || 0) > 80
          ? 'Ventilation checks and room comfort rounds are recommended this evening.'
          : 'Room comfort conditions are within a manageable range.',
    },
    {
      role: 'Transport',
      text:
        (current.windSpeed || 0) > 25 || (current.visibility || 99) < 5
          ? 'Route supervisors should validate departure timing before releasing vehicles.'
          : 'Normal departure planning can continue.',
    },
    {
      role: 'AQI',
      text: aqiInfo
        ? `${aqiInfo.label} air quality is currently affecting outdoor exposure planning.`
        : 'AQI guidance will appear after the next successful sync.',
    },
  ];
};

export const downloadTextFile = (filename, content, mimeType = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const formatAlertAudience = (alert) => {
  const roles = alert?.targetRoles || [];
  if (!roles.length) return 'Role targets not specified';
  return roles
    .map((role) => role.charAt(0).toUpperCase() + role.slice(1))
    .join(', ');
};

export const getConditionBadge = (condition) => {
  const icon = getWeatherIcon(condition);
  return {
    icon,
    label: condition || 'Clear',
  };
};
