import { Router } from "express";
import { openrouter } from "@workspace/integrations-openrouter-ai";
import { getCached, setCached, TTL } from "../lib/db-cache";
import { GetDashboardSummaryQueryParams } from "@workspace/api-zod";

const AI_MODELS = [
  "deepseek/deepseek-chat-v3-0324:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
];

async function aiComplete(prompt: string, maxTokens: number): Promise<string | null> {
  for (const model of AI_MODELS) {
    try {
      const resp = await (openrouter as any).chat.completions.create({
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      });
      const content = resp.choices?.[0]?.message?.content as string | undefined;
      if (content) return content;
    } catch {}
  }
  return null;
}

const router = Router();

const WMO_CONDITIONS: Record<number, string> = {
  0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Foggy", 51: "Light Drizzle", 61: "Light Rain", 63: "Moderate Rain",
  65: "Heavy Rain", 80: "Rain Showers", 95: "Thunderstorm",
};

async function fetchLiveWeatherForDashboard(location: string) {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!geoRes.ok) return null;
    const geoData: any = await geoRes.json();
    const geo = geoData.results?.[0];
    if (!geo) return null;

    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature,precipitation,uv_index&timezone=auto`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!wxRes.ok) return null;
    const wxData: any = await wxRes.json();
    const c = wxData.current;
    const code = c.weather_code ?? 0;
    const condition = WMO_CONDITIONS[code] ?? "Partly Cloudy";
    return {
      location,
      temperature: Math.round(c.temperature_2m ?? 20),
      humidity: Math.round(c.relative_humidity_2m ?? 60),
      rainfall: Math.round((c.precipitation ?? 0) * 10) / 10,
      condition,
      windSpeed: Math.round(c.wind_speed_10m ?? 10),
      feelsLike: Math.round(c.apparent_temperature ?? 18),
      uvIndex: Math.round(c.uv_index ?? 5),
      updatedAt: new Date().toISOString(),
      isLive: true,
    };
  } catch {
    return null;
  }
}

function getWeatherFallback(location: string) {
  const seed = location.length;
  const temp = 18 + (seed % 15);
  const conditions = ["Partly Cloudy", "Mainly Clear", "Light Rain", "Clear Sky", "Overcast"];
  const condition = conditions[seed % conditions.length];
  return {
    location,
    temperature: temp,
    humidity: 55 + (seed % 35),
    rainfall: condition.includes("Rain") ? 2.5 : 0,
    condition,
    windSpeed: 8 + (seed % 12),
    feelsLike: temp - 2,
    uvIndex: 6 + (seed % 5),
    updatedAt: new Date().toISOString(),
    isLive: false,
  };
}

const FARMING_TIPS = [
  "Rotate your crops each season to reduce pest buildup and improve soil health.",
  "Apply mulch around plants to conserve moisture and suppress weeds during dry periods.",
  "Test your soil every 2–3 years to optimize fertilizer application and reduce costs.",
  "Scout for pests early in the morning when they are most active and easier to spot.",
  "Keep detailed farm records — yields, costs, and weather — to make better decisions each season.",
  "Intercropping legumes with cereals improves nitrogen content and overall farm productivity.",
  "Irrigate in the early morning to minimize evaporation and reduce fungal disease risk.",
  "Use cover crops during the off-season to prevent soil erosion and fix nitrogen.",
  "Monitor commodity market prices weekly to choose the best selling window for your harvest.",
  "Healthy soils produce healthy crops — invest in compost and organic matter addition.",
  "Join a farmer cooperative to access better input prices and collective marketing power.",
  "GPS-based precision agriculture can reduce input costs by 15-20% on large farms.",
];

router.get("/dashboard/summary", async (req, res) => {
  const parsed = GetDashboardSummaryQueryParams.safeParse(req.query);
  const location = (parsed.success && parsed.data.location) ? parsed.data.location : "Nairobi, Kenya";

  try {
    // Run weather fetch and AI cache lookup in parallel
    const today = new Date().toDateString();
    const cacheKey = `dashboard_ai_${location}_${today}`;

    const [weather, cachedAI] = await Promise.all([
      fetchLiveWeatherForDashboard(location),
      getCached<{ cropRecommendation: string; marketAlert: string; farmingTip: string }>(cacheKey),
    ]);

    const currentWeather = weather ?? getWeatherFallback(location);

    let cropRec = "Analyze your local season — consult Crops tab for recommendations";
    let marketAlert = "Check the Market tab for live commodity prices in your region";
    let aiTip = FARMING_TIPS[new Date().getDate() % FARMING_TIPS.length];

    if (cachedAI) {
      cropRec = cachedAI.cropRecommendation ?? cropRec;
      marketAlert = cachedAI.marketAlert ?? marketAlert;
      aiTip = cachedAI.farmingTip ?? aiTip;
    } else {
      try {
        const aiPrompt = `You are an expert agronomist. Given the location "${location}" and current date ${today}, respond with a JSON object with exactly these 3 fields:
{
  "cropRecommendation": "one sentence naming 1-2 best crops to focus on now and why",
  "marketAlert": "one sentence about a current market opportunity or risk for this region",
  "farmingTip": "one practical, specific farming tip for this region and season"
}
No markdown, just the JSON.`;

        const text = await aiComplete(aiPrompt, 300) ?? "{}";
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const ai = JSON.parse(cleaned);
        cropRec = ai.cropRecommendation ?? cropRec;
        marketAlert = ai.marketAlert ?? marketAlert;
        aiTip = ai.farmingTip ?? aiTip;
        await setCached(cacheKey, { cropRecommendation: cropRec, marketAlert, farmingTip: aiTip }, TTL.DASHBOARD);
      } catch {}
    }

    const alertCount = (currentWeather.rainfall > 5 ? 1 : 0) + (currentWeather.windSpeed > 30 ? 1 : 0) + ((currentWeather as any).condition?.includes("Thunderstorm") ? 1 : 0);

    res.json({
      weather: currentWeather,
      topCropRecommendation: cropRec,
      marketAlert,
      farmingTip: aiTip,
      alertCount,
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching dashboard summary");
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});

export default router;
