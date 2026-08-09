/** National Weather Service client for Durant, OK (KDUA / OUN grid 138,28). */

const UA = "MagnoliaMaids/1.0 (https://magnoliamaids.pro, hello@magnoliamaids.pro)";
const FORECAST_URL = "https://api.weather.gov/gridpoints/OUN/138,28/forecast";
const OBS_URL = "https://api.weather.gov/stations/KDUA/observations/latest";

export type CurrentConditions = {
  temperatureF: number | null;
  feelsLikeF: number | null;
  humidity: number | null;
  windMph: number | null;
  windDirection: string | null;
  description: string | null;
  observedAt: string | null;
};

export type ForecastPeriod = {
  name: string;
  isDaytime: boolean;
  temperatureF: number | null;
  shortForecast: string;
  detailedForecast: string;
  precipChance: number | null;
  windSpeed: string | null;
};

export type DurantWeather = {
  current: CurrentConditions | null;
  periods: ForecastPeriod[];
  fetchedAt: string;
  error: string | null;
};

const cToF = (c: number | null | undefined) =>
  typeof c === "number" ? Math.round((c * 9) / 5 + 32) : null;
const kmhToMph = (k: number | null | undefined) =>
  typeof k === "number" ? Math.round(k * 0.621371) : null;

function degreesToCompass(deg: number | null | undefined): string | null {
  if (typeof deg !== "number") return null;
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16] ?? null;
}

async function getJson(url: string, signal: AbortSignal): Promise<any> {
  const res = await fetch(url, {
    signal,
    headers: { "User-Agent": UA, Accept: "application/geo+json" },
  });
  if (!res.ok) throw new Error(`NWS ${res.status}`);
  return res.json();
}

export async function fetchDurantWeather(): Promise<DurantWeather> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const [obsResult, fcResult] = await Promise.allSettled([
      getJson(OBS_URL, controller.signal),
      getJson(FORECAST_URL, controller.signal),
    ]);

    let current: CurrentConditions | null = null;
    if (obsResult.status === "fulfilled") {
      const p = obsResult.value?.properties ?? {};
      current = {
        temperatureF: cToF(p.temperature?.value),
        feelsLikeF: cToF(p.heatIndex?.value ?? p.windChill?.value ?? p.temperature?.value),
        humidity:
          typeof p.relativeHumidity?.value === "number" ? Math.round(p.relativeHumidity.value) : null,
        windMph: kmhToMph(p.windSpeed?.value),
        windDirection: degreesToCompass(p.windDirection?.value),
        description: typeof p.textDescription === "string" ? p.textDescription : null,
        observedAt: typeof p.timestamp === "string" ? p.timestamp : null,
      };
      if (current.temperatureF === null && current.description === null) current = null;
    }

    let periods: ForecastPeriod[] = [];
    if (fcResult.status === "fulfilled") {
      const raw = fcResult.value?.properties?.periods;
      if (Array.isArray(raw)) {
        periods = raw.slice(0, 10).map((p: any) => ({
          name: String(p.name ?? ""),
          isDaytime: Boolean(p.isDaytime),
          temperatureF: typeof p.temperature === "number" ? p.temperature : null,
          shortForecast: String(p.shortForecast ?? ""),
          detailedForecast: String(p.detailedForecast ?? ""),
          precipChance:
            typeof p.probabilityOfPrecipitation?.value === "number"
              ? p.probabilityOfPrecipitation.value
              : null,
          windSpeed: typeof p.windSpeed === "string" ? p.windSpeed : null,
        }));
      }
    }

    const failed = !current && periods.length === 0;
    return {
      current,
      periods,
      fetchedAt: new Date().toISOString(),
      error: failed ? "The National Weather Service feed is unavailable right now." : null,
    };
  } catch {
    return {
      current: null,
      periods: [],
      fetchedAt: new Date().toISOString(),
      error: "The National Weather Service feed is unavailable right now.",
    };
  } finally {
    clearTimeout(timer);
  }
}