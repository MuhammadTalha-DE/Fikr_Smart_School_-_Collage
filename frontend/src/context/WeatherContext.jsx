import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getCurrentWeather,
  getHourlyForecast,
  getWeeklyForecast,
  getAQI,
  getWeatherAlerts,
} from '../services/weatherService';

const WeatherContext = createContext(null);

export const WeatherProvider = ({ children }) => {
  const [current, setCurrent] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [aqi, setAqi] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [currentRes, hourlyRes, weeklyRes, aqiRes, alertsRes] = await Promise.allSettled([
        getCurrentWeather(),
        getHourlyForecast(),
        getWeeklyForecast(),
        getAQI(),
        getWeatherAlerts(),
      ]);

      if (currentRes.status === 'fulfilled') setCurrent(currentRes.value.data.data);
      if (hourlyRes.status === 'fulfilled') setHourly(hourlyRes.value.data.data || []);
      if (weeklyRes.status === 'fulfilled') setWeekly(weeklyRes.value.data.data || []);
      if (aqiRes.status === 'fulfilled') setAqi(aqiRes.value.data.data);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data.data || []);

      setError(null);
    } catch (err) {
      console.error('WeatherContext fetch error:', err);
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchAll]);

  const refresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <WeatherContext.Provider
      value={{
        current,
        hourly,
        weekly,
        aqi,
        alerts,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) throw new Error('useWeather must be used within a WeatherProvider');
  return context;
};

export default WeatherContext;
