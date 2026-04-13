import { WEATHER_API_URL } from '../config/constants';

export interface WeatherData {
  temperature: number;
  windspeed: number;
  description: string;
  high: number;
  low: number;
  precipitation: number;
  snowfall: number;
}

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export async function getWeather(): Promise<WeatherData> {
  const res = await fetch(WEATHER_API_URL);
  if (!res.ok) throw new Error(`Weather API error: ${res.statusText}`);

  const data = await res.json() as {
    current_weather: { temperature: number; windspeed: number; weathercode: number };
    daily: { temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[]; snowfall_sum: number[] };
  };
  const current = data.current_weather;
  const daily = data.daily;

  return {
    temperature: current.temperature,
    windspeed: current.windspeed,
    description: WMO_CODES[current.weathercode] || 'Unknown',
    high: daily.temperature_2m_max[0],
    low: daily.temperature_2m_min[0],
    precipitation: daily.precipitation_sum[0],
    snowfall: daily.snowfall_sum[0],
  };
}

export function formatWeatherForDisplay(weather: WeatherData): string {
  let text = `${weather.temperature}°C, ${weather.description}`;
  text += `\nHigh: ${weather.high}°C / Low: ${weather.low}°C`;
  text += `\nWind: ${weather.windspeed} km/h`;

  if (weather.snowfall > 0) {
    text += `\n❄️ Fresh snow: ${weather.snowfall}cm`;
  }
  if (weather.precipitation > 0) {
    text += `\nPrecipitation: ${weather.precipitation}mm`;
  }

  return text;
}
