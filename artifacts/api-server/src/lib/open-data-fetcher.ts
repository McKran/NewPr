/**
 * Open Data Fetcher
 *
 * Fetches agricultural and climate data exclusively from free, open-source APIs:
 *   - Open-Meteo Geocoding API  (https://open-meteo.com) — no API key required
 *   - Open-Meteo Historical Weather API (archive-api.open-meteo.com) — no API key
 *   - Open-Meteo Forecast API (api.open-meteo.com) — no API key
 *   - Wikipedia REST API (en.wikipedia.org/api/rest_v1) — no API key
 *   - World Bank Open Data API (api.worldbank.org/v2) — no API key
 *
 * No paid or restricted APIs are used anywhere in this module.
 */

const TIMEOUT_MS = 12000;

function sig(ms = TIMEOUT_MS) {
  return AbortSignal.timeout(ms);
}

export interface GeoResult {
  lat: number;
  lon: number;
  name: string;
  country: string;
  countryCode: string;
  elevation: number;
  timezone: string;
}

export interface DailyClimateRecord {
  dates: string[];
  tempMax: number[];
  tempMin: number[];
  precipitation: number[];
  uvIndex?: number[];
}

export interface ClimateProfile {
  location: string;
  lat: number;
  lon: number;
  elevation: number;
  timezone: string;
  annualMeanTemp: number;
  annualTotalRainfall: number;
  monthlyMeanTemp: number[];
  monthlyTotalRain: number[];
  dryMonths: number[];
  rainyMonths: number[];
  avgDailyGDD: number;
  source: string;
}

export interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  precipProbability: number;
  uvIndex: number;
}

export interface CropWikiInfo {
  title: string;
  extract: string;
  source: string;
}

export interface CountryContext {
  name: string;
  region: string;
  incomeLevel: string;
  capitalCity: string;
  source: string;
}

/**
 * Geocode a free-text location name using Open-Meteo Geocoding API.
 * Source: https://open-meteo.com/en/docs/geocoding-api (free, no key)
 */
export async function geocodeLocation(location: string): Promise<GeoResult | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const res = await fetch(url, { signal: sig(6000) });
    if (!res.ok) return null;
    const data: any = await res.json();
    const r = data.results?.[0];
    if (!r) return null;
    return {
      lat: r.latitude,
      lon: r.longitude,
      name: r.name,
      country: r.country ?? "",
      countryCode: r.country_code ?? "",
      elevation: r.elevation ?? 0,
      timezone: r.timezone ?? "UTC",
    };
  } catch {
    return null;
  }
}

/**
 * Fetch the past 12 months of daily weather data from Open-Meteo Historical API.
 * Source: https://archive-api.open-meteo.com (free, no key, ERA5-based reanalysis)
 * Used to compute local GDD rates and seasonal rainfall patterns.
 */
export async function fetchHistoricalWeather(lat: number, lon: number): Promise<DailyClimateRecord | null> {
  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 1);

    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const url =
      `https://archive-api.open-meteo.com/v1/archive` +
      `?latitude=${lat}&longitude=${lon}` +
      `&start_date=${fmt(startDate)}&end_date=${fmt(endDate)}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max` +
      `&timezone=auto`;

    const res = await fetch(url, { signal: sig() });
    if (!res.ok) return null;
    const data: any = await res.json();

    return {
      dates: data.daily?.time ?? [],
      tempMax: data.daily?.temperature_2m_max ?? [],
      tempMin: data.daily?.temperature_2m_min ?? [],
      precipitation: data.daily?.precipitation_sum ?? [],
      uvIndex: data.daily?.uv_index_max ?? [],
    };
  } catch {
    return null;
  }
}

/**
 * Build a climate profile from historical weather records.
 * Computes monthly means, seasonal patterns, and average daily GDD (base 10°C).
 */
export function buildClimateProfile(
  geo: GeoResult,
  historical: DailyClimateRecord
): ClimateProfile {
  const n = historical.dates.length;
  if (n === 0) {
    return {
      location: geo.name,
      lat: geo.lat,
      lon: geo.lon,
      elevation: geo.elevation,
      timezone: geo.timezone,
      annualMeanTemp: 22,
      annualTotalRainfall: 800,
      monthlyMeanTemp: Array(12).fill(22),
      monthlyTotalRain: Array(12).fill(67),
      dryMonths: [],
      rainyMonths: [],
      avgDailyGDD: 8,
      source: "fallback",
    };
  }

  const monthlyTempSum = Array(12).fill(0);
  const monthlyTempCount = Array(12).fill(0);
  const monthlyRain = Array(12).fill(0);
  let totalGDD = 0;

  for (let i = 0; i < n; i++) {
    const month = new Date(historical.dates[i]).getMonth();
    const tmax = historical.tempMax[i] ?? 0;
    const tmin = historical.tempMin[i] ?? 0;
    const rain = historical.precipitation[i] ?? 0;
    const tmean = (tmax + tmin) / 2;
    monthlyTempSum[month] += tmean;
    monthlyTempCount[month]++;
    monthlyRain[month] += rain;
    const gdd = Math.max(0, tmean - 10);
    totalGDD += gdd;
  }

  const monthlyMeanTemp = monthlyTempSum.map((s, i) =>
    monthlyTempCount[i] > 0 ? Math.round((s / monthlyTempCount[i]) * 10) / 10 : 22
  );
  const monthlyTotalRain = monthlyRain.map(r => Math.round(r));
  const annualMeanTemp = Math.round((monthlyMeanTemp.reduce((a, b) => a + b, 0) / 12) * 10) / 10;
  const annualTotalRainfall = monthlyTotalRain.reduce((a, b) => a + b, 0);
  const avgDailyGDD = Math.round((totalGDD / n) * 10) / 10;

  const monthlyRainMean = annualTotalRainfall / 12;
  const dryMonths = monthlyTotalRain
    .map((r, i) => (r < monthlyRainMean * 0.5 ? i : -1))
    .filter(i => i >= 0);
  const rainyMonths = monthlyTotalRain
    .map((r, i) => (r > monthlyRainMean * 1.4 ? i : -1))
    .filter(i => i >= 0);

  return {
    location: geo.name,
    lat: geo.lat,
    lon: geo.lon,
    elevation: geo.elevation,
    timezone: geo.timezone,
    annualMeanTemp,
    annualTotalRainfall,
    monthlyMeanTemp,
    monthlyTotalRain,
    dryMonths,
    rainyMonths,
    avgDailyGDD,
    source: "Open-Meteo Historical Weather API (ERA5 reanalysis, free/open)",
  };
}

/**
 * Fetch 16-day weather forecast from Open-Meteo Forecast API.
 * Source: https://api.open-meteo.com (free, no key)
 */
export async function fetchForecast(lat: number, lon: number): Promise<ForecastDay[]> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max` +
      `&timezone=auto&forecast_days=16`;
    const res = await fetch(url, { signal: sig() });
    if (!res.ok) return [];
    const data: any = await res.json();
    const d = data.daily;
    if (!d?.time) return [];

    return (d.time as string[]).map((date: string, i: number) => ({
      date,
      tempMax: d.temperature_2m_max?.[i] ?? 25,
      tempMin: d.temperature_2m_min?.[i] ?? 15,
      precipitation: d.precipitation_sum?.[i] ?? 0,
      precipProbability: d.precipitation_probability_max?.[i] ?? 0,
      uvIndex: d.uv_index_max?.[i] ?? 5,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch crop information from the Wikipedia REST API.
 * Source: https://en.wikipedia.org/api/rest_v1 (free, open, no key required)
 */
export async function fetchCropWikiInfo(cropName: string): Promise<CropWikiInfo | null> {
  const searchTerms = [cropName, `${cropName} crop`, `${cropName} plant`];
  for (const term of searchTerms) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
      const res = await fetch(url, { signal: sig(8000), headers: { "Accept": "application/json" } });
      if (!res.ok) continue;
      const data: any = await res.json();
      if (data.type === "disambiguation" || !data.extract) continue;
      return {
        title: data.title,
        extract: data.extract,
        source: `Wikipedia REST API: https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
      };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Fetch country context from the World Bank Open Data API.
 * Source: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392 (free, no key)
 */
export async function fetchCountryContext(countryCode: string): Promise<CountryContext | null> {
  if (!countryCode || countryCode.length < 2) return null;
  try {
    const url = `https://api.worldbank.org/v2/country/${countryCode.toLowerCase()}?format=json`;
    const res = await fetch(url, { signal: sig(8000) });
    if (!res.ok) return null;
    const data: any = await res.json();
    const c = data?.[1]?.[0];
    if (!c) return null;
    return {
      name: c.name,
      region: c.region?.value ?? "",
      incomeLevel: c.incomeLevel?.value ?? "",
      capitalCity: c.capitalCity ?? "",
      source: "World Bank Open Data API (free, no key required)",
    };
  } catch {
    return null;
  }
}
