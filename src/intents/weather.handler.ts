import { getWeather, formatWeatherForDisplay } from '../services/weather';

export async function handleWeatherIntent(): Promise<string> {
  const weather = await getWeather();
  const display = formatWeatherForDisplay(weather);

  let response = `🌤️ *Verbier right now*\n${display}`;

  if (weather.snowfall > 10) {
    response += `\n\nHeads up — decent dump coming. Might want to set an early alarm.`;
  }

  return response;
}
