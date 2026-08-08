import { Router } from "express";
import {
  GetCropRecommendationsQueryParams,
  GetCropCalendarQueryParams,
} from "@workspace/api-zod";

const router = Router();

const ALL_CROP_DATA = [
  { cropName: "Maize", suitability: "Excellent", riskLevel: "Low", estimatedYield: "4-8 tons/ha", plantingWindow: "Mar–May", notes: "Primary staple crop worldwide. Performs well in loam soils with adequate rainfall. Intercrop with beans for better soil nitrogen.", icon: "🌽", season: "long-rains", climate: ["tropical", "temperate", "continental"] },
  { cropName: "Wheat", suitability: "Excellent", riskLevel: "Low", estimatedYield: "3-7 tons/ha", plantingWindow: "Oct–Dec", notes: "Major cereal for global markets. Requires cool temperatures and well-drained soils. Good export potential.", icon: "🌾", season: "dry", climate: ["temperate", "continental", "mediterranean"] },
  { cropName: "Rice", suitability: "Excellent", riskLevel: "Medium", estimatedYield: "3-6 tons/ha", plantingWindow: "Apr–Jun", notes: "Key staple in Asia and Africa. Paddy varieties require flooded conditions; upland rice needs good moisture.", icon: "🍚", season: "long-rains", climate: ["tropical"] },
  { cropName: "Sorghum", suitability: "Excellent", riskLevel: "Low", estimatedYield: "2-4 tons/ha", plantingWindow: "Apr–Jun", notes: "Drought-tolerant. Ideal for semi-arid regions. Both grain and fodder uses.", icon: "🌾", season: "short-rains", climate: ["tropical", "arid"] },
  { cropName: "Millet", suitability: "Good", riskLevel: "Low", estimatedYield: "1.5-3 tons/ha", plantingWindow: "May–Jul", notes: "Highly drought-tolerant. Excellent for food security in dry climates. Short growing season.", icon: "🌾", season: "short-rains", climate: ["tropical", "arid"] },
  { cropName: "Barley", suitability: "Good", riskLevel: "Low", estimatedYield: "3-6 tons/ha", plantingWindow: "Sep–Nov", notes: "Cold-tolerant cereal for highland areas. High demand for malt and animal feed.", icon: "🌾", season: "dry", climate: ["temperate", "continental", "mediterranean"] },
  { cropName: "Teff", suitability: "Excellent", riskLevel: "Low", estimatedYield: "1-2 tons/ha", plantingWindow: "May–Jul", notes: "Ethiopian superfood grain. Gluten-free, high in iron. Growing export demand to health markets.", icon: "🌾", season: "long-rains", climate: ["tropical"] },
  { cropName: "Cassava", suitability: "Excellent", riskLevel: "Low", estimatedYield: "15-35 tons/ha", plantingWindow: "Mar–May", notes: "Key food security crop in Africa. Drought-tolerant after establishment. High carbohydrate content.", icon: "🥔", season: "long-rains", climate: ["tropical"] },
  { cropName: "Yam", suitability: "Good", riskLevel: "Medium", estimatedYield: "10-20 tons/ha", plantingWindow: "Feb–Apr", notes: "High-value crop in West Africa. Requires staking and well-drained fertile soils.", icon: "🍠", season: "long-rains", climate: ["tropical"] },
  { cropName: "Sweet Potato", suitability: "Excellent", riskLevel: "Low", estimatedYield: "10-20 tons/ha", plantingWindow: "Apr–May", notes: "Highly nutritious and fast-maturing. Orange-fleshed varieties rich in Vitamin A.", icon: "🍠", season: "long-rains", climate: ["tropical", "temperate"] },
  { cropName: "Potatoes", suitability: "Excellent", riskLevel: "Low", estimatedYield: "15-30 tons/ha", plantingWindow: "Feb–Apr", notes: "Thrives in cool highlands. Requires well-drained fertile soil. High market demand year-round.", icon: "🥔", season: "long-rains", climate: ["temperate", "continental", "tropical"] },
  { cropName: "Beans", suitability: "Excellent", riskLevel: "Low", estimatedYield: "1.5-3 tons/ha", plantingWindow: "Mar–Apr", notes: "Nitrogen fixer. Excellent for soil health. Wide market demand. Intercrop with maize.", icon: "🫘", season: "long-rains", climate: ["tropical", "temperate"] },
  { cropName: "Soybeans", suitability: "Excellent", riskLevel: "Low", estimatedYield: "2-4 tons/ha", plantingWindow: "Apr–Jun", notes: "Major global commodity. Strong export market. Used for oil, meal, and animal feed.", icon: "🫘", season: "long-rains", climate: ["tropical", "temperate", "continental"] },
  { cropName: "Groundnuts", suitability: "Good", riskLevel: "Low", estimatedYield: "1.5-3 tons/ha", plantingWindow: "Mar–May", notes: "High protein and oil content. Good drought tolerance after establishment.", icon: "🥜", season: "long-rains", climate: ["tropical", "arid"] },
  { cropName: "Cowpeas", suitability: "Excellent", riskLevel: "Low", estimatedYield: "1-2 tons/ha", plantingWindow: "May–Jun", notes: "Drought-tolerant legume for semi-arid areas. Leaves used as vegetables. Improves soil fertility.", icon: "🫘", season: "short-rains", climate: ["tropical", "arid"] },
  { cropName: "Chickpeas", suitability: "Good", riskLevel: "Low", estimatedYield: "1-2.5 tons/ha", plantingWindow: "Oct–Nov", notes: "High-value legume for export. Cool-season crop. Good for Mediterranean and highland climates.", icon: "🫘", season: "dry", climate: ["mediterranean", "temperate"] },
  { cropName: "Tomatoes", suitability: "Excellent", riskLevel: "Medium", estimatedYield: "20-50 tons/ha", plantingWindow: "Feb–Apr", notes: "High-value vegetable. Requires irrigation and intensive management. Excellent market prices.", icon: "🍅", season: "dry", climate: ["tropical", "temperate", "mediterranean"] },
  { cropName: "Onions", suitability: "Good", riskLevel: "Medium", estimatedYield: "10-25 tons/ha", plantingWindow: "Jun–Aug", notes: "Good dry-season crop. High and consistent market demand.", icon: "🧅", season: "dry", climate: ["tropical", "temperate", "arid"] },
  { cropName: "Garlic", suitability: "Good", riskLevel: "Medium", estimatedYield: "5-15 tons/ha", plantingWindow: "Sep–Nov", notes: "High-value crop with strong local and export demand. Prefers well-drained soils.", icon: "🧄", season: "dry", climate: ["mediterranean", "temperate"] },
  { cropName: "Cabbage", suitability: "Good", riskLevel: "Low", estimatedYield: "20-50 tons/ha", plantingWindow: "Apr–Jun", notes: "Cool-season vegetable with consistent market. Short rotation cycle.", icon: "🥬", season: "short-rains", climate: ["tropical", "temperate"] },
  { cropName: "Carrots", suitability: "Good", riskLevel: "Low", estimatedYield: "20-40 tons/ha", plantingWindow: "Mar–May", notes: "High nutrition value. Requires deep loose soil. Good processing and fresh market value.", icon: "🥕", season: "long-rains", climate: ["temperate", "tropical"] },
  { cropName: "Avocado", suitability: "Excellent", riskLevel: "Low", estimatedYield: "8-15 tons/ha", plantingWindow: "Year-round", notes: "Perennial with high export value. Growing global demand. Requires 3-5 years to first harvest.", icon: "🥑", season: "long-rains", climate: ["tropical", "mediterranean"] },
  { cropName: "Bananas", suitability: "Excellent", riskLevel: "Low", estimatedYield: "20-40 tons/ha", plantingWindow: "Year-round", notes: "Year-round producer. Key staple and export commodity. Requires sufficient water and nutrients.", icon: "🍌", season: "long-rains", climate: ["tropical"] },
  { cropName: "Mangoes", suitability: "Good", riskLevel: "Low", estimatedYield: "5-15 tons/ha", plantingWindow: "Oct–Dec", notes: "Perennial tree crop. Drought-tolerant once established. Good domestic and export markets.", icon: "🥭", season: "dry", climate: ["tropical", "arid"] },
  { cropName: "Coffee", suitability: "Excellent", riskLevel: "Medium", estimatedYield: "0.5-2 tons/ha", plantingWindow: "Year-round", notes: "Premium export crop. Shade-grown arabica fetches highest prices. 3-4 years to first harvest.", icon: "☕", season: "long-rains", climate: ["tropical"] },
  { cropName: "Tea", suitability: "Excellent", riskLevel: "Low", estimatedYield: "2-4 tons/ha (dry leaf)", plantingWindow: "Year-round", notes: "Perennial with consistent global demand. Best in high-altitude tropical regions.", icon: "🍵", season: "long-rains", climate: ["tropical"] },
  { cropName: "Cotton", suitability: "Good", riskLevel: "Medium", estimatedYield: "1-3 tons/ha", plantingWindow: "Apr–Jun", notes: "Major cash crop for textile industry. Requires 180-200 frost-free days.", icon: "🪤", season: "long-rains", climate: ["tropical", "arid"] },
  { cropName: "Sugarcane", suitability: "Excellent", riskLevel: "Low", estimatedYield: "60-120 tons/ha", plantingWindow: "Mar–Apr", notes: "Long-cycle crop (12-18 months). High biomass for sugar and ethanol production.", icon: "🎋", season: "long-rains", climate: ["tropical"] },
  { cropName: "Sunflower", suitability: "Good", riskLevel: "Low", estimatedYield: "1.5-3 tons/ha", plantingWindow: "Mar–Apr", notes: "Drought-tolerant oil crop. Stable prices. Good rotational crop for soil health.", icon: "🌻", season: "long-rains", climate: ["temperate", "tropical", "continental"] },
  { cropName: "Cocoa", suitability: "Excellent", riskLevel: "Medium", estimatedYield: "0.5-1.5 tons/ha", plantingWindow: "Year-round", notes: "Premium commodity with surging global prices. Requires humid tropical climate.", icon: "🍫", season: "long-rains", climate: ["tropical"] },
  { cropName: "Rubber", suitability: "Good", riskLevel: "Low", estimatedYield: "1-2 tons/ha latex", plantingWindow: "Year-round", notes: "Perennial tree crop for industrial rubber. Good returns after initial 6-7 year wait.", icon: "🌳", season: "long-rains", climate: ["tropical"] },
  { cropName: "Sesame", suitability: "Good", riskLevel: "Low", estimatedYield: "0.5-1.5 tons/ha", plantingWindow: "Jun–Jul", notes: "High-value oil crop. Drought tolerant. Growing export demand for food and oil sectors.", icon: "🌿", season: "short-rains", climate: ["tropical", "arid"] },
  { cropName: "Cashew", suitability: "Good", riskLevel: "Low", estimatedYield: "1-3 tons/ha", plantingWindow: "Year-round", notes: "Perennial tree crop suited to tropical coastal areas. High export value.", icon: "🥜", season: "dry", climate: ["tropical"] },
  { cropName: "Ginger", suitability: "Good", riskLevel: "Medium", estimatedYield: "10-20 tons/ha", plantingWindow: "Mar–Apr", notes: "High-value spice with strong export demand. Requires shade and well-drained soils.", icon: "🫚", season: "long-rains", climate: ["tropical"] },
];

const CALENDAR_EVENTS = [
  { crop: "Maize", activity: "Land preparation and plowing", daysFromNow: 2, priority: "high" },
  { crop: "Beans", activity: "Seed procurement and treatment", daysFromNow: 5, priority: "medium" },
  { crop: "Tomatoes", activity: "Nursery bed preparation", daysFromNow: 7, priority: "high" },
  { crop: "Maize", activity: "Planting — optimal window opens", daysFromNow: 10, priority: "high" },
  { crop: "Potatoes", activity: "Seed potato preparation", daysFromNow: 12, priority: "medium" },
  { crop: "Beans", activity: "Planting alongside maize", daysFromNow: 14, priority: "medium" },
  { crop: "Tomatoes", activity: "Transplanting to main field", daysFromNow: 21, priority: "high" },
  { crop: "All crops", activity: "First fertilizer top-dressing", daysFromNow: 28, priority: "medium" },
  { crop: "Maize", activity: "Pest scouting — stem borer check", daysFromNow: 35, priority: "low" },
  { crop: "Soybeans", activity: "Inoculation and planting", daysFromNow: 8, priority: "medium" },
  { crop: "Sorghum", activity: "Variety selection and seed prep", daysFromNow: 15, priority: "medium" },
  { crop: "Coffee", activity: "Pruning and canopy management", daysFromNow: 3, priority: "medium" },
  { crop: "Avocado", activity: "Irrigation schedule assessment", daysFromNow: 7, priority: "low" },
  { crop: "Cassava", activity: "Stem cutting selection", daysFromNow: 10, priority: "medium" },
  { crop: "All crops", activity: "Soil pH testing and lime application", daysFromNow: 45, priority: "medium" },
];

router.get("/crops/recommendations", async (req, res) => {
  const parsed = GetCropRecommendationsQueryParams.safeParse(req.query);
  const season = (parsed.success && parsed.data.season) ? parsed.data.season : "long-rains";
  const climate = req.query.climate as string || "";

  try {
    let filtered = ALL_CROP_DATA.filter(c => c.season === season || season === "all");
    if (climate && filtered.length > 0) {
      const climateFiltered = filtered.filter(c => c.climate.includes(climate as any));
      if (climateFiltered.length >= 3) filtered = climateFiltered;
    }
    const results = (filtered.length > 0 ? filtered : ALL_CROP_DATA).map(
      ({ season: _s, climate: _c, ...crop }) => crop
    );
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Error getting crop recommendations");
    res.status(500).json({ error: "Failed to fetch crop recommendations" });
  }
});

router.get("/crops/calendar", async (req, res) => {
  try {
    res.json(CALENDAR_EVENTS);
  } catch (err) {
    req.log.error({ err }, "Error getting crop calendar");
    res.status(500).json({ error: "Failed to fetch crop calendar" });
  }
});

export default router;
