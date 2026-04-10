import type { WeatherData, ForecastDay } from "./types";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

const DAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

let cache: { data: WeatherData; fetchedAt: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function fetchWeather(): Promise<WeatherData> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  try {
    const url = new URL(OPEN_METEO_URL);
    url.searchParams.set("latitude", "48.1351");
    url.searchParams.set("longitude", "11.5820");
    url.searchParams.set("hourly", "precipitation,weather_code");
    url.searchParams.set(
      "daily",
      "precipitation_sum,weather_code,temperature_2m_max,uv_index_max,wind_speed_10m_max"
    );
    url.searchParams.set("past_days", "3");
    url.searchParams.set("forecast_days", "7");
    url.searchParams.set("timezone", "Europe/Berlin");

    const resp = await fetch(url.toString(), {
      next: { revalidate: 1800 },
    });
    const data = await resp.json();

    const hourlyTimes: string[] = data.hourly.time;
    const hourlyPrecip: number[] = data.hourly.precipitation;
    const hourlyWeatherCodes: number[] = data.hourly.weather_code;

    const nowMs = Date.now();

    // Find current hour index
    const currentHourIdx = hourlyTimes.findIndex((t) => {
      return new Date(t).getTime() > nowMs;
    });
    const refIdx = currentHourIdx > 0 ? currentHourIdx - 1 : hourlyTimes.length - 1;

    // Calculate rain sums
    const last24hStart = Math.max(0, refIdx - 23);
    const last48hStart = Math.max(0, refIdx - 47);
    const last72hStart = Math.max(0, refIdx - 71);
    const next24hEnd = Math.min(hourlyTimes.length - 1, refIdx + 24);

    const rainLast24h = hourlyPrecip
      .slice(last24hStart, refIdx + 1)
      .reduce((a, b) => a + (b || 0), 0);
    const rainLast48h = hourlyPrecip
      .slice(last48hStart, refIdx + 1)
      .reduce((a, b) => a + (b || 0), 0);
    const rainLast72h = hourlyPrecip
      .slice(last72hStart, refIdx + 1)
      .reduce((a, b) => a + (b || 0), 0);
    const forecastRain = hourlyPrecip
      .slice(refIdx + 1, next24hEnd + 1)
      .reduce((a, b) => a + (b || 0), 0);
    const weatherCode = hourlyWeatherCodes[refIdx] ?? 0;

    // Build 7-day forecast from daily data
    const dailyDates: string[] = data.daily?.time ?? [];
    const dailyRain: number[] = data.daily?.precipitation_sum ?? [];
    const dailyWeather: number[] = data.daily?.weather_code ?? [];
    const dailyMaxTemp: number[] = data.daily?.temperature_2m_max ?? [];
    const dailyUV: number[] = data.daily?.uv_index_max ?? [];
    const dailyWind: number[] = data.daily?.wind_speed_10m_max ?? [];

    // Find today's index for current UV / wind
    const todayStr = new Date().toISOString().split("T")[0];
    const todayIdx = dailyDates.findIndex((d) => d === todayStr);
    const uvIndexMax = todayIdx >= 0 ? Math.round(dailyUV[todayIdx] ?? 0) : 0;
    const windSpeedMax = todayIdx >= 0 ? Math.round(dailyWind[todayIdx] ?? 0) : 0;

    const forecastDays: ForecastDay[] = dailyDates
      .slice(0, 7)
      .map((dateStr, i) => {
        const d = new Date(dateStr);
        return {
          date: dateStr,
          dayLabel: DAY_LABELS[d.getDay()],
          rainSum: dailyRain[i] ?? 0,
          maxTemp: dailyMaxTemp[i] ?? 0,
          weatherCode: dailyWeather[i] ?? 0,
          uvIndexMax: Math.round(dailyUV[i] ?? 0),
          windSpeedMax: Math.round(dailyWind[i] ?? 0),
        };
      });

    const weatherData: WeatherData = {
      rainLast24h: Math.round(rainLast24h * 10) / 10,
      rainLast48h: Math.round(rainLast48h * 10) / 10,
      rainLast72h: Math.round(rainLast72h * 10) / 10,
      forecastRain: Math.round(forecastRain * 10) / 10,
      weatherCode,
      uvIndexMax,
      windSpeedMax,
      forecastDays,
    };

    cache = { data: weatherData, fetchedAt: nowMs };
    return weatherData;
  } catch {
    if (cache) return cache.data;
    return {
      rainLast24h: 0,
      rainLast48h: 0,
      rainLast72h: 0,
      forecastRain: 0,
      weatherCode: 0,
      uvIndexMax: 0,
      windSpeedMax: 0,
      forecastDays: [],
    };
  }
}
