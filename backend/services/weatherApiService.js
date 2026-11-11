const axios = require('axios');
const WeatherCurrent = require('../models/WeatherCurrent');

/**
 * Weather API Service
 * Fetches real-time weather data from OpenWeather API
 * Supports: current weather, forecast, AQI, historical
 */

const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Default campus location: Zoormandi, Palai, Malakand, KPK
const DEFAULT_LAT = 34.6342;
const DEFAULT_LON = 71.8440;
const DEFAULT_FALLBACK_TEMPERATURE = 29;
const DEFAULT_FALLBACK_AQI = 2;

class WeatherApiService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    this.latitude = DEFAULT_LAT;
    this.longitude = DEFAULT_LON;
    this.locationName = 'Zoormandi, Malakand, KPK';
  }

  /**
   * Update the campus location
   */
  setLocation(lat, lon, name) {
    this.latitude = lat;
    this.longitude = lon;
    if (name) this.locationName = name;
  }

  isAuthError(error) {
    return error?.response?.status === 401;
  }

  getErrorMessage(type, error) {
    const status = error?.response?.status;
    const detail = status ? `${error.message} (status ${status})` : error.message;

    if (this.isAuthError(error)) {
      return `OpenWeather authentication failed for ${type}. Check OPENWEATHER_API_KEY. ${detail}`;
    }

    return `Weather API Error (${type}): ${detail}`;
  }

  async getLatestStoredWeather(lat = this.latitude, lon = this.longitude) {
    return WeatherCurrent.findOne({
      latitude: lat,
      longitude: lon,
    }).sort({ recordedAt: -1 }).lean();
  }

  buildCachedCurrentWeather(record, error) {
    return {
      ...record,
      source: `Cached Weather (${record.source || 'last successful sync'})`,
      isFallback: true,
      apiError: this.getErrorMessage('current', error),
    };
  }

  buildCachedAQI(record, error) {
    if (!record || record.aqi == null) {
      return null;
    }

    return {
      aqi: record.aqi,
      pm25: record.pm25 ?? null,
      pm10: record.pm10 ?? null,
      o3: null,
      no2: null,
      so2: null,
      co: null,
      recordedAt: record.recordedAt || new Date(),
      source: 'Cached AQI (last successful sync)',
      isFallback: true,
      apiError: this.getErrorMessage('AQI', error),
    };
  }

  /**
   * Get current weather data from OpenWeather
   */
  async getCurrentWeather(lat = this.latitude, lon = this.longitude) {
    try {
      const url = `${OPENWEATHER_BASE_URL}/weather`;
      const response = await axios.get(url, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
        },
      });

      const data = response.data;
      return {
        locationName: data.name || this.locationName,
        latitude: lat,
        longitude: lon,
        temperature: Math.round(data.main.temp * 10) / 10,
        feelsLike: Math.round(data.main.feels_like * 10) / 10,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: Math.round(data.wind.speed * 3.6 * 10) / 10,
        windDirection: data.wind.deg || 0,
        visibility: (data.visibility || 10000) / 1000,
        condition: data.weather[0]?.main || 'Unknown',
        description: data.weather[0]?.description || '',
        icon: data.weather[0]?.icon || '01d',
        cloudCoverage: data.clouds?.all || 0,
        rainfall: data.rain?.['1h'] || 0,
        uvIndex: 0,
        recordedAt: new Date(),
        source: 'OpenWeather API',
        isFallback: false,
      };
    } catch (error) {
      console.error(`❌ ${this.getErrorMessage('current', error)}`);

      const cached = await this.getLatestStoredWeather(lat, lon);
      if (cached) {
        return this.buildCachedCurrentWeather(cached, error);
      }

      return this.getMockCurrentWeather(lat, lon, error);
    }
  }

  /**
   * Get 5-day / 3-hour forecast
   */
  async getForecast(lat = this.latitude, lon = this.longitude) {
    try {
      const url = `${OPENWEATHER_BASE_URL}/forecast`;
      const response = await axios.get(url, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric',
          cnt: 40,
        },
      });

      return response.data.list.map((item) => ({
        time: new Date(item.dt * 1000),
        temperature: Math.round(item.main.temp * 10) / 10,
        feelsLike: Math.round(item.main.feels_like * 10) / 10,
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        windSpeed: Math.round(item.wind.speed * 3.6 * 10) / 10,
        condition: item.weather[0]?.main || 'Unknown',
        description: item.weather[0]?.description || '',
        icon: item.weather[0]?.icon || '01d',
        cloudCoverage: item.clouds?.all || 0,
        rainfall: item.rain?.['3h'] || 0,
        pop: Math.round((item.pop || 0) * 100),
        source: 'OpenWeather Forecast',
        isFallback: false,
      }));
    } catch (error) {
      console.error(`❌ ${this.getErrorMessage('forecast', error)}`);
      const cached = await this.getLatestStoredWeather(lat, lon);
      return this.getMockForecast(cached?.temperature ?? DEFAULT_FALLBACK_TEMPERATURE, error);
    }
  }

  /**
   * Get Air Quality Index
   */
  async getAQI(lat = this.latitude, lon = this.longitude) {
    try {
      const url = `${OPENWEATHER_BASE_URL}/air_pollution`;
      const response = await axios.get(url, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
        },
      });

      const data = response.data.list[0];
      return {
        aqi: data.main.aqi,
        pm25: data.components.pm2_5,
        pm10: data.components.pm10,
        o3: data.components.o3,
        no2: data.components.no2,
        so2: data.components.so2,
        co: data.components.co,
        recordedAt: new Date(),
        source: 'OpenWeather AQI',
        isFallback: false,
      };
    } catch (error) {
      console.error(`❌ ${this.getErrorMessage('AQI', error)}`);
      const cached = await this.getLatestStoredWeather(lat, lon);
      return this.buildCachedAQI(cached, error) || this.getMockAQI(error);
    }
  }

  /**
   * Get UV Index
   */
  async getUVIndex(lat = this.latitude, lon = this.longitude) {
    try {
      const url = `${OPENWEATHER_BASE_URL}/uvi`;
      const response = await axios.get(url, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
        },
      });

      return {
        uvIndex: response.data.value,
        recordedAt: new Date(),
        source: 'OpenWeather UV',
        isFallback: false,
      };
    } catch (error) {
      console.error(`❌ ${this.getErrorMessage('UV', error)}`);
      return {
        uvIndex: 0,
        recordedAt: new Date(),
        source: 'Fallback UV (OpenWeather unavailable)',
        isFallback: true,
        apiError: this.getErrorMessage('UV', error),
      };
    }
  }

  /**
   * Get comprehensive weather data (current + AQI + UV + forecast)
   */
  async getComprehensiveWeather(lat = this.latitude, lon = this.longitude) {
    const [current, aqi, uv, forecast] = await Promise.all([
      this.getCurrentWeather(lat, lon),
      this.getAQI(lat, lon),
      this.getUVIndex(lat, lon),
      this.getForecast(lat, lon),
    ]);

    return {
      current: { ...current, uvIndex: uv.uvIndex },
      aqi,
      forecast,
      location: { lat, lon, name: this.locationName },
      recordedAt: new Date(),
      isFallback: Boolean(current?.isFallback || aqi?.isFallback || uv?.isFallback || forecast?.some((item) => item.isFallback)),
    };
  }

  getMockCurrentWeather(lat, lon, error) {
    const temp = DEFAULT_FALLBACK_TEMPERATURE;

    return {
      locationName: this.locationName,
      latitude: lat || this.latitude,
      longitude: lon || this.longitude,
      temperature: temp,
      feelsLike: 31,
      humidity: 58,
      pressure: 1009,
      windSpeed: 11,
      windDirection: 180,
      visibility: 8,
      condition: 'Partly Cloudy',
      description: 'fallback weather data',
      icon: '02d',
      cloudCoverage: 42,
      rainfall: 0,
      uvIndex: 0,
      recordedAt: new Date(),
      source: 'Fallback Weather (OpenWeather unavailable)',
      isFallback: true,
      apiError: this.getErrorMessage('current', error),
    };
  }

  getMockForecast(baseTemperature = DEFAULT_FALLBACK_TEMPERATURE, error) {
    const now = new Date();
    const list = [];

    for (let i = 0; i < 24; i += 1) {
      const time = new Date(now.getTime() + i * 3 * 60 * 60 * 1000);
      const temperature = Math.round((baseTemperature + Math.sin(i * Math.PI / 12) * 3) * 10) / 10;
      const condition = i % 5 === 0 ? 'Cloudy' : 'Partly Cloudy';

      list.push({
        time,
        temperature,
        feelsLike: Math.round((temperature + 1.5) * 10) / 10,
        humidity: 60,
        pressure: 1009,
        windSpeed: 12,
        condition,
        description: condition.toLowerCase(),
        icon: condition === 'Cloudy' ? '04d' : '02d',
        cloudCoverage: condition === 'Cloudy' ? 68 : 38,
        rainfall: 0,
        pop: 10,
        source: 'Fallback Forecast (OpenWeather unavailable)',
        isFallback: true,
        apiError: this.getErrorMessage('forecast', error),
      });
    }

    return list;
  }

  getMockAQI(error) {
    return {
      aqi: DEFAULT_FALLBACK_AQI,
      pm25: 18,
      pm10: 30,
      o3: 32,
      no2: 16,
      so2: 6,
      co: 0.42,
      recordedAt: new Date(),
      source: 'Fallback AQI (OpenWeather unavailable)',
      isFallback: true,
      apiError: this.getErrorMessage('AQI', error),
    };
  }
}

module.exports = new WeatherApiService();
