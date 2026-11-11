import { createRequire } from 'module';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const axios = require('axios');
const WeatherCurrent = require('../models/WeatherCurrent');
const weatherApiService = require('../services/weatherApiService');

const createWeatherQuery = (record) => ({
  sort: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(record),
});

describe('weatherApiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps live current weather data into the ERP shape', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: {
        name: 'Malakand',
        main: { temp: 29.4, feels_like: 31.2, humidity: 67, pressure: 1008 },
        wind: { speed: 3.5, deg: 170 },
        visibility: 9000,
        weather: [{ main: 'Clouds', description: 'broken clouds', icon: '04d' }],
        clouds: { all: 58 },
      },
    });

    const result = await weatherApiService.getCurrentWeather();

    expect(result.temperature).toBe(29.4);
    expect(result.feelsLike).toBe(31.2);
    expect(result.windSpeed).toBe(12.6);
    expect(result.condition).toBe('Clouds');
    expect(result.isFallback).toBe(false);
  });

  it('falls back to cached current weather when the API returns 401', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue({
      message: 'Request failed with status code 401',
      response: { status: 401 },
    });
    vi.spyOn(WeatherCurrent, 'findOne').mockReturnValue(createWeatherQuery({
      locationName: 'Cached Campus',
      latitude: 34.6,
      longitude: 71.8,
      temperature: 29,
      feelsLike: 30,
      humidity: 54,
      pressure: 1007,
      windSpeed: 10,
      visibility: 8,
      condition: 'Clear',
      recordedAt: new Date('2026-06-12T23:00:00.000Z'),
      source: 'OpenWeather API',
      aqi: 2,
      pm25: 16,
      pm10: 28,
    }));

    const result = await weatherApiService.getCurrentWeather();

    expect(result.isFallback).toBe(true);
    expect(result.temperature).toBe(29);
    expect(result.source).toContain('Cached Weather');
    expect(result.apiError).toContain('OPENWEATHER_API_KEY');
  });

  it('returns mock AQI when there is no cached AQI data', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue({
      message: 'Request failed with status code 401',
      response: { status: 401 },
    });
    vi.spyOn(WeatherCurrent, 'findOne').mockReturnValue(createWeatherQuery(null));

    const result = await weatherApiService.getAQI();

    expect(result.isFallback).toBe(true);
    expect(result.aqi).toBe(2);
    expect(result.source).toContain('Fallback AQI');
  });
});
