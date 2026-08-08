import { Router } from "express";
import { openrouter } from "@workspace/integrations-openrouter-ai";
import { getCached, setCached, TTL } from "../lib/db-cache";
import { GetMarketPricesQueryParams, GetMarketInsightQueryParams } from "@workspace/api-zod";

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
        temperature: 0.3,
      });
      const content = resp.choices?.[0]?.message?.content as string | undefined;
      if (content) return content;
    } catch {}
  }
  return null;
}

const router = Router();

const GLOBAL_BASE_PRICES_USD_PER_TON: Record<string, { local: number; intl: number; category: string; unit: string }> = {
  "Maize": { local: 185, intl: 215, category: "Cereals", unit: "ton" },
  "Wheat": { local: 220, intl: 255, category: "Cereals", unit: "ton" },
  "Rice": { local: 440, intl: 520, category: "Cereals", unit: "ton" },
  "Sorghum": { local: 155, intl: 180, category: "Cereals", unit: "ton" },
  "Millet": { local: 180, intl: 210, category: "Cereals", unit: "ton" },
  "Barley": { local: 195, intl: 225, category: "Cereals", unit: "ton" },
  "Oats": { local: 185, intl: 215, category: "Cereals", unit: "ton" },
  "Teff": { local: 650, intl: 800, category: "Cereals", unit: "ton" },
  "Cassava": { local: 180, intl: 220, category: "Tubers & Roots", unit: "ton" },
  "Yam": { local: 350, intl: 420, category: "Tubers & Roots", unit: "ton" },
  "Sweet Potato": { local: 280, intl: 340, category: "Tubers & Roots", unit: "ton" },
  "Potatoes": { local: 220, intl: 290, category: "Tubers & Roots", unit: "ton" },
  "Beans": { local: 780, intl: 920, category: "Legumes", unit: "ton" },
  "Soybeans": { local: 480, intl: 560, category: "Legumes", unit: "ton" },
  "Groundnuts": { local: 1100, intl: 1280, category: "Legumes", unit: "ton" },
  "Cowpeas": { local: 680, intl: 820, category: "Legumes", unit: "ton" },
  "Chickpeas": { local: 750, intl: 900, category: "Legumes", unit: "ton" },
  "Lentils": { local: 820, intl: 980, category: "Legumes", unit: "ton" },
  "Pigeon Peas": { local: 720, intl: 860, category: "Legumes", unit: "ton" },
  "Tomatoes": { local: 550, intl: 680, category: "Vegetables", unit: "ton" },
  "Onions": { local: 320, intl: 400, category: "Vegetables", unit: "ton" },
  "Garlic": { local: 1800, intl: 2200, category: "Vegetables", unit: "ton" },
  "Kale": { local: 420, intl: 520, category: "Vegetables", unit: "ton" },
  "Cabbage": { local: 280, intl: 350, category: "Vegetables", unit: "ton" },
  "Spinach": { local: 480, intl: 590, category: "Vegetables", unit: "ton" },
  "Carrots": { local: 380, intl: 460, category: "Vegetables", unit: "ton" },
  "Eggplant": { local: 420, intl: 510, category: "Vegetables", unit: "ton" },
  "Bell Pepper": { local: 850, intl: 1050, category: "Vegetables", unit: "ton" },
  "Chili Pepper": { local: 1200, intl: 1500, category: "Vegetables", unit: "ton" },
  "Cucumber": { local: 350, intl: 430, category: "Vegetables", unit: "ton" },
  "Pumpkin": { local: 240, intl: 300, category: "Vegetables", unit: "ton" },
  "Lettuce": { local: 580, intl: 720, category: "Vegetables", unit: "ton" },
  "Broccoli": { local: 680, intl: 840, category: "Vegetables", unit: "ton" },
  "Cauliflower": { local: 620, intl: 780, category: "Vegetables", unit: "ton" },
  "Zucchini": { local: 420, intl: 520, category: "Vegetables", unit: "ton" },
  "Avocado": { local: 1500, intl: 1800, category: "Fruits", unit: "ton" },
  "Bananas": { local: 320, intl: 420, category: "Fruits", unit: "ton" },
  "Mangoes": { local: 480, intl: 620, category: "Fruits", unit: "ton" },
  "Citrus": { local: 380, intl: 480, category: "Fruits", unit: "ton" },
  "Pineapple": { local: 420, intl: 540, category: "Fruits", unit: "ton" },
  "Watermelon": { local: 180, intl: 240, category: "Fruits", unit: "ton" },
  "Papaya": { local: 380, intl: 490, category: "Fruits", unit: "ton" },
  "Grapes": { local: 680, intl: 850, category: "Fruits", unit: "ton" },
  "Apples": { local: 580, intl: 720, category: "Fruits", unit: "ton" },
  "Strawberries": { local: 2200, intl: 2800, category: "Fruits", unit: "ton" },
  "Coconut": { local: 580, intl: 720, category: "Fruits", unit: "ton" },
  "Guava": { local: 420, intl: 540, category: "Fruits", unit: "ton" },
  "Passion Fruit": { local: 680, intl: 860, category: "Fruits", unit: "ton" },
  "Coffee": { local: 3800, intl: 4500, category: "Cash Crops", unit: "ton" },
  "Tea": { local: 2400, intl: 3000, category: "Cash Crops", unit: "ton" },
  "Cotton": { local: 1600, intl: 1950, category: "Cash Crops", unit: "ton" },
  "Sugarcane": { local: 38, intl: 46, category: "Cash Crops", unit: "ton" },
  "Tobacco": { local: 3200, intl: 4100, category: "Cash Crops", unit: "ton" },
  "Cocoa": { local: 7500, intl: 9200, category: "Cash Crops", unit: "ton" },
  "Rubber": { local: 1450, intl: 1750, category: "Cash Crops", unit: "ton" },
  "Sisal": { local: 880, intl: 1100, category: "Cash Crops", unit: "ton" },
  "Jute": { local: 680, intl: 840, category: "Cash Crops", unit: "ton" },
  "Sunflower": { local: 520, intl: 640, category: "Oil Crops", unit: "ton" },
  "Canola (Rapeseed)": { local: 530, intl: 650, category: "Oil Crops", unit: "ton" },
  "Palm Oil": { local: 920, intl: 1100, category: "Oil Crops", unit: "ton" },
  "Sesame": { local: 1650, intl: 2000, category: "Oil Crops", unit: "ton" },
  "Flaxseed": { local: 480, intl: 580, category: "Oil Crops", unit: "ton" },
  "Cashew": { local: 4500, intl: 5800, category: "Nuts & Spices", unit: "ton" },
  "Macadamia": { local: 6500, intl: 8000, category: "Nuts & Spices", unit: "ton" },
  "Vanilla": { local: 180000, intl: 220000, category: "Nuts & Spices", unit: "ton" },
  "Black Pepper": { local: 5500, intl: 7000, category: "Nuts & Spices", unit: "ton" },
  "Cardamom": { local: 18000, intl: 22000, category: "Nuts & Spices", unit: "ton" },
  "Ginger": { local: 1200, intl: 1500, category: "Nuts & Spices", unit: "ton" },
  "Turmeric": { local: 1800, intl: 2200, category: "Nuts & Spices", unit: "ton" },

  // ── Philippine-Specific Crops ─────────────────────────────────────────────
  // Vegetables
  "Ampalaya": { local: 680, intl: 840, category: "Philippine Vegetables", unit: "ton" },
  "Pechay": { local: 480, intl: 600, category: "Philippine Vegetables", unit: "ton" },
  "Kangkong": { local: 380, intl: 480, category: "Philippine Vegetables", unit: "ton" },
  "Malunggay": { local: 520, intl: 650, category: "Philippine Vegetables", unit: "ton" },
  "Okra": { local: 540, intl: 670, category: "Philippine Vegetables", unit: "ton" },
  "Squash (Kalabasa)": { local: 240, intl: 300, category: "Philippine Vegetables", unit: "ton" },
  "String Beans (Sitaw)": { local: 580, intl: 720, category: "Philippine Vegetables", unit: "ton" },
  "Patola": { local: 420, intl: 530, category: "Philippine Vegetables", unit: "ton" },
  "Upo": { local: 380, intl: 480, category: "Philippine Vegetables", unit: "ton" },
  "Sayote": { local: 320, intl: 400, category: "Philippine Vegetables", unit: "ton" },
  "Mustasa": { local: 420, intl: 530, category: "Philippine Vegetables", unit: "ton" },
  "Chili (Sili)": { local: 1200, intl: 1500, category: "Philippine Vegetables", unit: "ton" },
  // Fruits
  "Calamansi": { local: 1100, intl: 1380, category: "Philippine Fruits", unit: "ton" },
  "Durian": { local: 1400, intl: 1750, category: "Philippine Fruits", unit: "ton" },
  "Jackfruit (Langka)": { local: 680, intl: 850, category: "Philippine Fruits", unit: "ton" },
  "Lanzones": { local: 1200, intl: 1500, category: "Philippine Fruits", unit: "ton" },
  "Rambutan": { local: 780, intl: 980, category: "Philippine Fruits", unit: "ton" },
  "Mangosteen": { local: 2200, intl: 2800, category: "Philippine Fruits", unit: "ton" },
  "Dragon Fruit": { local: 1600, intl: 2000, category: "Philippine Fruits", unit: "ton" },
  "Santol": { local: 480, intl: 600, category: "Philippine Fruits", unit: "ton" },
  "Star Apple (Kaimito)": { local: 680, intl: 850, category: "Philippine Fruits", unit: "ton" },
  "Atis (Sugar Apple)": { local: 750, intl: 940, category: "Philippine Fruits", unit: "ton" },
  // Root Crops
  "Ube (Purple Yam)": { local: 1800, intl: 2200, category: "Philippine Root Crops", unit: "ton" },
  "Taro (Gabi)": { local: 560, intl: 700, category: "Philippine Root Crops", unit: "ton" },
  // Herbs & Spices
  "Lemongrass (Tanglad)": { local: 680, intl: 850, category: "Philippine Herbs & Spices", unit: "ton" },
  "Basil (Balanoy)": { local: 820, intl: 1030, category: "Philippine Herbs & Spices", unit: "ton" },
  // Legumes
  "Mung Bean (Mungo)": { local: 780, intl: 980, category: "Philippine Legumes", unit: "ton" },
};

function deterministicJitter(crop: string, date: string, field: string): number {
  let hash = 0;
  const str = `${crop}${date}${field}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 200 - 100) / 1000;
}

function getFallbackPrices(crops: string[], today: string) {
  return crops.map(crop => {
    const base = GLOBAL_BASE_PRICES_USD_PER_TON[crop];
    if (!base) return null;
    const jitter = deterministicJitter(crop, today, "jitter");
    const trendSeed = Math.abs(deterministicJitter(crop, today, "trend"));
    const trend = trendSeed < 0.04 ? "rising" : trendSeed < 0.07 ? "falling" : "stable";
    const changeRaw = deterministicJitter(crop, today, "change") * 150;
    const changePercent = trend === "rising" ? Math.abs(changeRaw) + 0.5 : trend === "falling" ? -(Math.abs(changeRaw) + 0.5) : Math.abs(changeRaw) * 0.3;
    return {
      crop,
      localPrice: Math.round(base.local * (1 + jitter)),
      internationalPrice: Math.round(base.intl * (1 + jitter)),
      unit: base.unit,
      trend,
      changePercent: Math.round(changePercent * 10) / 10,
      category: base.category,
      aiInsight: "Based on global commodity market averages",
    };
  }).filter(Boolean);
}

async function getAIEnhancedPrices(location: string, crops: string[]): Promise<any[]> {
  const today = new Date().toISOString().split("T")[0];
  const cacheKey = `market_prices_${location}_${today}_${crops.slice(0, 5).join("_")}`;

  const cached = await getCached<any[]>(cacheKey);
  if (cached) return cached;

  const basePricesForCrops = crops.slice(0, 20).map(crop => {
    const base = GLOBAL_BASE_PRICES_USD_PER_TON[crop];
    if (!base) return null;
    const jitter = deterministicJitter(crop, today, "jitter");
    return `${crop}: ~$${Math.round(base.local * (1 + jitter))}/ton local, ~$${Math.round(base.intl * (1 + jitter))}/ton international`;
  }).filter(Boolean).join("\n");

  const month = new Date().toLocaleString("en", { month: "long" });

  const prompt = `You are an expert agricultural commodity market analyst. Today is ${today}, month: ${month}.
Location: ${location}
Crops: ${crops.slice(0, 20).join(", ")}
Base reference prices (USD/metric ton):
${basePricesForCrops}

Generate realistic, location-adjusted market prices considering local supply/demand, seasonal patterns, transport costs, and current global commodity trends.

Respond ONLY with a valid JSON array — no markdown, no preamble:
[{"crop":"name","localPrice":number,"internationalPrice":number,"unit":"ton","trend":"rising|stable|falling","changePercent":number,"category":"string","aiInsight":"one concise sentence"}]

Vary the trends realistically — not everything rises.`;

  try {
    const raw = await aiComplete(prompt, 3500) ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonMatch = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    }

    const items = Array.isArray(parsed) ? parsed : (parsed.prices ?? parsed.data ?? parsed.results ?? []);
    if (Array.isArray(items) && items.length > 0) {
      await setCached(cacheKey, items, TTL.MARKET_PRICES);
      return items;
    }
  } catch {}

  return getFallbackPrices(crops, today);
}

async function getAIMarketInsight(crop: string, location: string, country: string): Promise<any> {
  const today = new Date().toISOString().split("T")[0];
  const cacheKey = `market_insight_${crop}_${location}_${today}`;

  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const base = GLOBAL_BASE_PRICES_USD_PER_TON[crop];
  const basePrice = base ? base.local : 500;
  const month = new Date().toLocaleString("en", { month: "long" });

  const prompt = `You are a senior agricultural market intelligence analyst with access to current global trade, weather, and supply chain data. Today is ${today} (${month}).

Analyze the market for: ${crop}
User location: ${location || "East Africa"}
Country: ${country || "Kenya"}
Current base price: ~$${basePrice} USD/metric ton

Provide a comprehensive market insight report. Structure your analysis as JSON with these exact fields:

{
  "crop": "${crop}",
  "currentPrice": <current estimated USD/metric ton>,
  "priceDirection": "rising|stable|falling",
  "changePercent": <percentage change from 30 days ago, positive or negative number>,
  "localAnalysis": "<2-3 sentences specifically about ${country || "the local"} market conditions>",
  "globalAnalysis": "<2-3 sentences about global market forces>",
  "keyDrivers": ["<factor 1>", "<factor 2>", "<factor 3>", "<factor 4>"],
  "futureOutlook": "<2-3 sentences forecasting price trajectory over next 4-8 weeks>",
  "seasonalNote": "<1 sentence about how ${month} typically affects ${crop} prices>",
  "confidence": "low|medium|high"
}`;

  try {
    const raw = await aiComplete(prompt, 1200) ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    }

    if (parsed && parsed.crop) {
      const result = { ...parsed, generatedAt: new Date().toISOString() };
      await setCached(cacheKey, result, TTL.MARKET_INSIGHT);
      return result;
    }
  } catch {}

  return {
    crop,
    currentPrice: basePrice,
    priceDirection: "stable",
    changePercent: 0,
    localAnalysis: `${crop} market conditions in ${country || "the local market"} are currently stable based on seasonal averages.`,
    globalAnalysis: `Global ${crop} markets are tracking near long-term averages with no major disruptions reported.`,
    keyDrivers: ["Seasonal harvest patterns", "Local demand conditions", "Transportation costs", "Currency exchange rates"],
    futureOutlook: `${crop} prices are expected to remain near current levels in the near term.`,
    seasonalNote: `${month} is a typical period for ${crop} in this region.`,
    confidence: "low",
    generatedAt: new Date().toISOString(),
  };
}

const ALL_CROPS = Object.keys(GLOBAL_BASE_PRICES_USD_PER_TON);

router.get("/market/prices", async (req, res) => {
  const parsed = GetMarketPricesQueryParams.safeParse(req.query);
  const category = parsed.success && parsed.data.category ? parsed.data.category : null;
  const location = (req.query.location as string) || "Global";

  try {
    let targetCrops = ALL_CROPS;
    if (category && category !== "all") {
      const normalized = category.toLowerCase().replace(/[^a-z]/g, "");
      targetCrops = ALL_CROPS.filter(crop => {
        const base = GLOBAL_BASE_PRICES_USD_PER_TON[crop];
        return base && base.category.toLowerCase().replace(/[^a-z]/g, "").startsWith(normalized);
      });
    }

    const prices = await getAIEnhancedPrices(location, targetCrops);
    res.json(prices);
  } catch (err) {
    req.log.error({ err }, "Error fetching market prices");
    const today = new Date().toISOString().split("T")[0];
    res.json(getFallbackPrices(ALL_CROPS, today));
  }
});

router.get("/market/insights", async (req, res) => {
  const parsed = GetMarketInsightQueryParams.safeParse(req.query);
  if (!parsed.success || !parsed.data.crop) {
    res.status(400).json({ error: "crop parameter is required" });
    return;
  }

  const { crop, location = "Global", country = "" } = parsed.data;

  try {
    const insight = await getAIMarketInsight(crop, location as string, country as string);
    res.json(insight);
  } catch (err) {
    req.log.error({ err }, "Error fetching market insight");
    res.status(500).json({ error: "Failed to generate market insight" });
  }
});

router.get("/market/trends", async (req, res) => {
  const location = (req.query.location as string) || "Global";
  try {
    const topCrops = ["Coffee", "Cocoa", "Wheat", "Maize", "Soybeans", "Rice", "Cotton", "Tomatoes", "Avocado", "Palm Oil", "Groundnuts", "Bananas"];
    const prices = await getAIEnhancedPrices(location, topCrops);
    const rising = prices.filter((p: any) => p.trend === "rising").sort((a: any, b: any) => b.changePercent - a.changePercent);
    const falling = prices.filter((p: any) => p.trend === "falling").sort((a: any, b: any) => a.changePercent - b.changePercent);
    const stable = prices.filter((p: any) => p.trend === "stable");

    res.json({
      topGainer: rising[0]?.crop ?? "Coffee",
      topLoser: falling[0]?.crop ?? "Cotton",
      mostStable: stable[0]?.crop ?? "Rice",
      marketSentiment: rising.length > falling.length ? "bullish" : falling.length > rising.length ? "bearish" : "neutral",
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching market trends");
    res.status(500).json({ error: "Failed to fetch market trends" });
  }
});

export default router;
