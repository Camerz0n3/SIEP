export const TIMEZONE = 'Europe/Zurich';
export const VERBIER_LAT = 46.0967;
export const VERBIER_LNG = 7.2286;

export const DEFAULT_EVENT_DURATION_MINUTES = 60;
export const DEFAULT_REMINDER_MINUTES_BEFORE = 30;
export const CONTEXT_WINDOW_MESSAGES = 20;
export const CONTEXT_TIMEOUT_HOURS = 4;

export const WHATSAPP_MAX_LENGTH = 4096;


export const WEATHER_API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${VERBIER_LAT}&longitude=${VERBIER_LNG}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,windspeed_10m_max&timezone=Europe/Zurich`;
