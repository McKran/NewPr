import { Router } from "express";

const router = Router();

const PSGC_BASE = "https://psgc.gitlab.io/api";
const psgcCache = new Map<string, { data: any; ts: number }>();
const geoCache = new Map<string, { lat: number; lon: number } | null>();
const PSGC_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

async function fetchPSGC<T>(path: string): Promise<T> {
  const cached = psgcCache.get(path);
  if (cached && Date.now() - cached.ts < PSGC_CACHE_TTL) return cached.data as T;
  const res = await fetch(`${PSGC_BASE}${path}`, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`PSGC error ${res.status} for ${path}`);
  const data = await res.json();
  psgcCache.set(path, { data, ts: Date.now() });
  return data as T;
}

async function geocodePHCity(cityName: string): Promise<{ lat: number; lon: number } | null> {
  const key = cityName.toLowerCase();
  if (geoCache.has(key)) return geoCache.get(key)!;
  try {
    const query = encodeURIComponent(cityName);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=10&language=en&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) { geoCache.set(key, null); return null; }
    const data: any = await res.json();
    const hit = (data.results ?? []).find((r: any) => r.country_code === "PH");
    const coords = hit ? { lat: hit.latitude, lon: hit.longitude } : null;
    geoCache.set(key, coords);
    return coords;
  } catch {
    geoCache.set(key, null);
    return null;
  }
}

router.get("/psgc/regions", async (req, res) => {
  try {
    const raw: any[] = await fetchPSGC("/regions/");
    const regions = raw
      .map(r => ({
        code: r.code,
        name: r.name,
        regionName: r.regionName ?? r.name,
        islandGroup: r.islandGroupCode ?? "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(regions);
  } catch (err) {
    req.log.error({ err }, "PSGC regions fetch error");
    res.status(500).json({ error: "Failed to fetch Philippine regions from PSGC" });
  }
});

router.get("/psgc/provinces", async (req, res) => {
  const regionCode = (req.query.region_code as string ?? "").trim();
  if (!regionCode) {
    res.status(400).json({ error: "region_code is required" });
    return;
  }
  try {
    const raw: any[] = await fetchPSGC(`/regions/${regionCode}/provinces/`);
    const provinces = raw
      .map(p => ({
        code: p.code,
        name: p.name,
        regionCode: p.regionCode ?? regionCode,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(provinces);
  } catch (err) {
    req.log.error({ err }, "PSGC provinces fetch error");
    res.status(500).json({ error: "Failed to fetch provinces from PSGC" });
  }
});

router.get("/psgc/cities", async (req, res) => {
  const regionCode = (req.query.region_code as string ?? "").trim();
  const provinceCode = (req.query.province_code as string ?? "").trim();

  if (!regionCode && !provinceCode) {
    res.status(400).json({ error: "region_code or province_code is required" });
    return;
  }
  try {
    let raw: any[];
    if (provinceCode) {
      raw = await fetchPSGC(`/provinces/${provinceCode}/cities-municipalities/`);
    } else {
      raw = await fetchPSGC(`/regions/${regionCode}/cities-municipalities/`);
    }
    const cities = raw
      .map(c => ({
        code: c.code,
        name: c.name,
        isCity: !!c.isCity,
        isMunicipality: !!c.isMunicipality,
        isCapital: !!c.isCapital,
        provinceCode: c.provinceCode ?? null,
      }))
      .sort((a, b) => {
        if (a.isCapital && !b.isCapital) return -1;
        if (!a.isCapital && b.isCapital) return 1;
        if (a.isCity && !b.isCity) return -1;
        if (!a.isCity && b.isCity) return 1;
        return a.name.localeCompare(b.name);
      });
    res.json(cities);
  } catch (err) {
    req.log.error({ err }, "PSGC cities fetch error");
    res.status(500).json({ error: "Failed to fetch cities from PSGC" });
  }
});

router.get("/psgc/geocode", async (req, res) => {
  const cityName = (req.query.city as string ?? "").trim();
  if (!cityName) {
    res.status(400).json({ error: "city query parameter is required" });
    return;
  }
  try {
    const coords = await geocodePHCity(cityName);
    if (!coords) {
      res.status(404).json({ error: `Could not find coordinates for "${cityName}"` });
      return;
    }
    res.json(coords);
  } catch (err) {
    req.log.error({ err }, "PSGC geocode error");
    res.status(500).json({ error: "Geocoding failed" });
  }
});

export default router;
