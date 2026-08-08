/**
 * Farming Plan Route
 *
 * All plans are generated using:
 *   1. Open-Meteo Historical Weather API — local GDD rates from real ERA5 reanalysis data
 *   2. Open-Meteo Forecast API — 16-day weather outlook
 *   3. Wikipedia REST API — crop information
 *   4. World Bank Open Data API — country context
 *   5. GDD-based rule engine — scientifically grounded, no AI calls
 *
 * Location: lat/lon coordinates only. Defaults to Manila (14.5995, 120.9842) if not provided.
 * No PSGC codes required — any Philippine location with coordinates works.
 *
 * NO AI models, NO hardcoded timelines, NO paid or restricted APIs.
 * Plans are persisted in PostgreSQL keyed by lat/lon to avoid redundant data fetches.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { farmingPlans } from "@workspace/db";
import { and, eq, gt } from "drizzle-orm";
import {
  fetchHistoricalWeather,
  buildClimateProfile,
  fetchForecast,
  fetchCropWikiInfo,
  fetchCountryContext,
  type GeoResult,
} from "../lib/open-data-fetcher";
import { generateFarmingPlan, listAvailableCrops } from "../lib/gdd-engine";

const router = Router();

// Default: Manila, Philippines
const PH_DEFAULT_LAT = 14.5995;
const PH_DEFAULT_LON = 120.9842;
const PLAN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Round to 2 decimal places to form a stable cache key from coordinates */
function toLocationKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

async function getCachedPlan(crop: string, locationKey: string, plantingDate: string) {
  try {
    const rows = await db
      .select()
      .from(farmingPlans)
      .where(
        and(
          eq(farmingPlans.crop, crop.toLowerCase()),
          eq(farmingPlans.location, locationKey),
          eq(farmingPlans.plantingDate, plantingDate),
          gt(farmingPlans.expiresAt, new Date())
        )
      )
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function savePlan(
  crop: string,
  locationKey: string,
  plantingDate: string,
  planData: any,
  climateProfile: any,
  dataSourcesUsed: string[]
) {
  try {
    await db.insert(farmingPlans).values({
      crop: crop.toLowerCase(),
      location: locationKey,
      plantingDate,
      planData,
      climateProfile,
      dataSourcesUsed,
      expiresAt: new Date(Date.now() + PLAN_TTL_MS),
    });
  } catch {
    // Non-fatal
  }
}

/**
 * POST /api/farming-plan/generate
 *
 * Body:
 *   crop         (required)  — crop name
 *   plantingDate (required)  — ISO date string
 *   lat          (optional)  — latitude, defaults to Manila
 *   lon          (optional)  — longitude, defaults to Manila
 *   locationName (optional)  — human-readable location label
 */
router.post("/farming-plan/generate", async (req, res) => {
  const {
    crop,
    plantingDate,
    lat: rawLat,
    lon: rawLon,
    locationName,
    // Legacy PSGC fields — accepted but not required, used for display only
    cityName,
    provinceName,
    regionName,
  } = req.body as {
    crop?: string;
    plantingDate?: string;
    lat?: number | null;
    lon?: number | null;
    locationName?: string;
    cityName?: string;
    provinceName?: string;
    regionName?: string;
  };

  if (!crop || !plantingDate) {
    res.status(400).json({ error: "crop and plantingDate are required" });
    return;
  }

  // Resolve coordinates — use provided or fall back to Manila
  const lat = rawLat != null && !isNaN(Number(rawLat)) ? Number(rawLat) : PH_DEFAULT_LAT;
  const lon = rawLon != null && !isNaN(Number(rawLon)) ? Number(rawLon) : PH_DEFAULT_LON;

  const locationKey = toLocationKey(lat, lon);

  // Best display name from whatever info is available
  const locationDisplay =
    locationName ||
    [cityName, provinceName, regionName, "Philippines"].filter(Boolean).join(", ") ||
    `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E, Philippines`;

  try {
    // 1. Check PostgreSQL cache first
    const cached = await getCachedPlan(crop, locationKey, plantingDate);
    if (cached) {
      req.log.info({ crop, locationKey }, "Returning cached farming plan");
      res.json({
        plan: cached.planData,
        weatherData: null,
        generatedAt: cached.generatedAt.toISOString(),
        cached: true,
        dataSourcesUsed: cached.dataSourcesUsed,
        location: { display: locationDisplay, lat, lon },
      });
      return;
    }

    // 2. Build GeoResult from coordinates
    const geo: GeoResult = {
      lat,
      lon,
      name: locationDisplay,
      country: "Philippines",
      countryCode: "PH",
      elevation: 0,
      timezone: "Asia/Manila",
    };

    // 3. Fetch all open data sources in parallel
    const [historical, forecast, wikiInfo, countryCtx] = await Promise.allSettled([
      fetchHistoricalWeather(geo.lat, geo.lon),
      fetchForecast(geo.lat, geo.lon),
      fetchCropWikiInfo(crop),
      fetchCountryContext("PH"),
    ]);

    const historicalData = historical.status === "fulfilled" ? historical.value : null;
    const forecastData = forecast.status === "fulfilled" ? forecast.value : [];
    const wiki = wikiInfo.status === "fulfilled" ? wikiInfo.value : null;
    const country = countryCtx.status === "fulfilled" ? countryCtx.value : null;

    // 4. Build climate profile
    const climateProfile = buildClimateProfile(
      geo,
      historicalData ?? { dates: [], tempMax: [], tempMin: [], precipitation: [] }
    );

    // 5. Generate farming plan (GDD engine — no AI)
    const plan = generateFarmingPlan(
      crop,
      plantingDate,
      locationDisplay,
      climateProfile,
      forecastData,
      wiki?.extract ?? null
    );

    if (country) {
      (plan as any).countryContext = {
        name: country.name,
        region: country.region,
        incomeLevel: country.incomeLevel,
        source: country.source,
      };
    }

    // 6. Save to PostgreSQL
    await savePlan(crop, locationKey, plantingDate, plan, climateProfile, plan.dataSourcesUsed);

    // 7. Build forecast response
    const forecastResponse =
      forecastData.length > 0
        ? {
            daily: {
              dates: forecastData.map((d) => d.date),
              maxTemps: forecastData.map((d) => d.tempMax),
              minTemps: forecastData.map((d) => d.tempMin),
              precipitation: forecastData.map((d) => d.precipitation),
              precipitationProbability: forecastData.map((d) => d.precipProbability),
              uvIndex: forecastData.map((d) => d.uvIndex),
            },
          }
        : null;

    req.log.info(
      { crop, lat, lon, locationKey, totalDays: plan.totalGrowingDays },
      "Generated farming plan"
    );

    res.json({
      plan,
      weatherData: forecastResponse,
      generatedAt: new Date().toISOString(),
      cached: false,
      dataSourcesUsed: plan.dataSourcesUsed,
      location: { display: locationDisplay, lat, lon },
    });
  } catch (err: any) {
    req.log.error({ err }, "Error generating farming plan");
    res.status(500).json({ error: "Failed to generate farming plan. Please try again." });
  }
});

/**
 * GET /api/farming-plan/crops
 * Returns all crops known to the GDD engine.
 */
router.get("/farming-plan/crops", (_req, res) => {
  res.json(listAvailableCrops());
});

/**
 * GET /api/farming-plan/data-sources
 */
router.get("/farming-plan/data-sources", (_req, res) => {
  res.json({
    description: "All agricultural intelligence is generated from free, open-source data only.",
    sources: [
      {
        name: "Open-Meteo Historical Weather API",
        url: "https://archive-api.open-meteo.com",
        description: "ERA5 reanalysis data — 1-year historical daily weather. Used for local GDD rates.",
        license: "CC BY 4.0",
        apiKey: false,
      },
      {
        name: "Open-Meteo Forecast API",
        url: "https://api.open-meteo.com",
        description: "16-day weather forecast for weather risk assessment.",
        license: "CC BY 4.0",
        apiKey: false,
      },
      {
        name: "Wikipedia REST API",
        url: "https://en.wikipedia.org/api/rest_v1",
        description: "Crop information and descriptions.",
        license: "CC BY-SA 3.0",
        apiKey: false,
      },
      {
        name: "World Bank Open Data API",
        url: "https://api.worldbank.org/v2",
        description: "Country-level agricultural and economic context.",
        license: "CC BY 4.0",
        apiKey: false,
      },
      {
        name: "FAO Paper No. 56 + GDD Crop Parameters",
        url: "https://www.fao.org/3/x0490e/x0490e00.htm",
        description: "Scientific basis for ET₀ calculation and crop coefficients from FAO, USDA, CIMMYT, IRRI.",
        license: "Open access",
        apiKey: false,
      },
    ],
  });
});

export default router;
