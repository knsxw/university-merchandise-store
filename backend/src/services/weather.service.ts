import axios from 'axios';
import { config } from '../config/env';

interface OpenMeteoCurrentWeather {
  time: string;
  temperature_2m: number;
  precipitation: number;
  weather_code: number;
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrentWeather;
  current_units?: {
    temperature_2m?: string;
    precipitation?: string;
  };
}

export interface WeatherRecommendation {
  source: 'Open-Meteo';
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  current: {
    observedAt: string;
    temperatureC: number;
    precipitationMm: number;
    weatherCode: number;
    condition: string;
  };
  recommendation: {
    message: string;
    productKeywords: string[];
  };
}

const CACHE_DURATION_MS = 10 * 60 * 1000;
let cachedWeather: { expiresAt: number; value: WeatherRecommendation } | undefined;

const describeWeatherCode = (code: number): string => {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 67) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorms';
  return 'Variable conditions';
};

const buildRecommendation = (
  temperatureC: number,
  precipitationMm: number,
  weatherCode: number
): WeatherRecommendation['recommendation'] => {
  const isWet = precipitationMm > 0 || (weatherCode >= 51 && weatherCode <= 67) || weatherCode >= 80;

  if (isWet) {
    return {
      message: 'Rain is around campus—consider a jacket or water-resistant tote.',
      productKeywords: ['jacket', 'hoodie', 'tote'],
    };
  }

  if (temperatureC >= 30) {
    return {
      message: 'It is hot today—stay hydrated and shaded on campus.',
      productKeywords: ['water bottle', 'cap'],
    };
  }

  if (temperatureC < 24) {
    return {
      message: 'It is cooler today—a hoodie or jacket may be useful.',
      productKeywords: ['hoodie', 'jacket'],
    };
  }

  return {
    message: 'Comfortable campus weather—these everyday essentials are a good fit.',
    productKeywords: ['notebook', 'tote', 'water bottle'],
  };
};

export async function fetchCampusWeatherRecommendation(): Promise<WeatherRecommendation> {
  if (cachedWeather && cachedWeather.expiresAt > Date.now()) {
    return cachedWeather.value;
  }

  const response = await axios.get<OpenMeteoResponse>(config.weatherApiUrl, {
    params: {
      latitude: config.campusLatitude,
      longitude: config.campusLongitude,
      current: 'temperature_2m,precipitation,weather_code',
      timezone: 'Asia/Bangkok',
    },
    timeout: 5000,
  });

  if (!response.data.current) {
    throw new Error('Open-Meteo returned no current weather data');
  }

  const { current } = response.data;
  const value: WeatherRecommendation = {
    source: 'Open-Meteo',
    location: {
      name: config.campusLocationName,
      latitude: config.campusLatitude,
      longitude: config.campusLongitude,
    },
    current: {
      observedAt: current.time,
      temperatureC: current.temperature_2m,
      precipitationMm: current.precipitation,
      weatherCode: current.weather_code,
      condition: describeWeatherCode(current.weather_code),
    },
    recommendation: {
      ...buildRecommendation(current.temperature_2m, current.precipitation, current.weather_code),
    },
  };

  cachedWeather = { expiresAt: Date.now() + CACHE_DURATION_MS, value };
  return value;
}
