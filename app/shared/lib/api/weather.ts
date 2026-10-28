type OpenWeatherResponse = {
  name: string;
  dt: number;
  timezone: number;
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
  };
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
};

const WEATHER_API_KEY =
  import.meta.env.VITE_OPENWEATHER_API_KEY ||
  import.meta.env.OPENWEATHER_API_KEY ||
  import.meta.env.VITE_WEATHER_API_KEY ||
  import.meta.env.WEATHER_API_KEY ||
  "";

function normalizeLocationQuery(location: string) {
  const cleaned = location.trim();
  if (!cleaned) return cleaned;
  if (cleaned.includes(",")) return cleaned;
  return `${cleaned},ID`;
}

export async function fetchCurrentWeather(location: string): Promise<OpenWeatherResponse> {
  if (!WEATHER_API_KEY) {
    throw new Error("Weather API key is not configured.");
  }

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("appid", WEATHER_API_KEY);
  url.searchParams.set("q", normalizeLocationQuery(location));
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "id");

  const res = await fetch(url.toString());
  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401 || String(data?.cod) === "401") {
      throw new Error("OpenWeather API key tidak valid. Pastikan key berasal dari OpenWeather dan sudah aktif.");
    }
    throw new Error(data?.message || "Failed to load weather data.");
  }

  return data as OpenWeatherResponse;
}

