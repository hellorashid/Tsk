// Weather service using Open-Meteo API
// API docs: https://open-meteo.com/

export interface WeatherData {
  temperature: number;
  condition: string;
  sunrise: string;
  sunset: string;
  hourlyTemperatures: { time: string; temperature: number; weatherCode: number; condition: string }[];
}

export const fetchWeatherData = async (latitude: number, longitude: number, date: Date): Promise<WeatherData> => {
  // Format date as YYYY-MM-DD for API (using local date)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // Get IANA timezone for the user's location
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunrise,sunset,weather_code,temperature_2m_mean&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=${encodeURIComponent(timezone)}&start_date=${dateStr}&end_date=${dateStr}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  
  const data = await response.json();
  
  // Extract data for the requested date
  const dailyData = data.daily;
  const sunrise = dailyData.sunrise[0];
  const sunset = dailyData.sunset[0];
  const temperature = Math.round(dailyData.temperature_2m_mean[0]);
  const weatherCode = dailyData.weather_code[0];
  
  // Extract hourly temperature and weather code data
  const hourlyData = data.hourly;
  const hourlyTemperatures = hourlyData.time.map((time: string, index: number) => ({
    time,
    temperature: Math.round(hourlyData.temperature_2m[index]),
    weatherCode: hourlyData.weather_code[index],
    condition: getWeatherCondition(hourlyData.weather_code[index])
  }));
  
  // Map weather code to condition
  const condition = getWeatherCondition(weatherCode);
  
  return {
    temperature,
    condition,
    sunrise,
    sunset,
    hourlyTemperatures
  };
};

// Map WMO weather codes to readable conditions
// Reference: https://open-meteo.com/en/docs
const getWeatherCondition = (code: number): string => {
  if (code === 0) return 'Clear';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 67) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Unknown';
};

// Get weather emoji based on condition
export const getWeatherEmoji = (condition: string): string => {
  switch (condition.toLowerCase()) {
    case 'clear': return '☀️';
    case 'partly cloudy': return '⛅';
    case 'cloudy': return '☁️';
    case 'foggy': return '🌫️';
    case 'rainy': return '🌧️';
    case 'snowy': return '❄️';
    case 'showers': return '🌦️';
    case 'snow showers': return '🌨️';
    case 'thunderstorm': return '⛈️';
    default: return '🌡️';
  }
};

