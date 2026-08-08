/**
 * GDD-Based Farming Plan Engine
 *
 * Generates farming plans using the Growing Degree Day (GDD) method.
 *
 * SCIENTIFIC BASIS:
 *   GDD = max(0, (Tmax + Tmin) / 2 - Tbase)
 *
 *   Crop growth stage thresholds (GDD values) are sourced from:
 *   - FAO Irrigation and Drainage Paper No. 56 (Allen et al., 1998)
 *     https://www.fao.org/3/x0490e/x0490e00.htm
 *   - USDA Agricultural Handbook No. 8 (open access)
 *   - CIMMYT (International Maize and Wheat Improvement Center) open data
 *   - Agronomy Journal publications (open access)
 *
 * IMPORTANT: The GDD thresholds below are biological CONSTANTS (not timelines).
 * The actual day numbers are computed at runtime from real local climate data,
 * making every plan location-specific and dynamically generated.
 */

import { ClimateProfile, ForecastDay } from "./open-data-fetcher";

export interface CropGDDProfile {
  name: string;
  category: string;
  emoji: string;
  gddBase: number;
  gddPhases: {
    germination: number;
    establishment: number;
    vegetative: number;
    flowering: number;
    fruitOrGrainSet: number;
    maturity: number;
  };
  tempRange: { min: number; optimal: number; max: number };
  waterRequirementMm: number;
  criticalWaterStages: string[];
  fertilizerProfile: {
    n_kg_ha: number;
    p_kg_ha: number;
    k_kg_ha: number;
    splitApplications: number;
  };
  commonPests: Array<{ name: string; tempTriggerMin: number; tempTriggerMax: number; humidityTrigger?: number }>;
  source: string;
}

const CROP_GDD_PROFILES: Record<string, CropGDDProfile> = {
  // ── Cereals / Grains ───────────────────────────────────────────────────────
  "rice": {
    name: "Rice", category: "Cereals", emoji: "🌾",
    gddBase: 10,
    gddPhases: { germination: 80, establishment: 200, vegetative: 600, flowering: 900, fruitOrGrainSet: 1100, maturity: 1400 },
    tempRange: { min: 10, optimal: 27, max: 38 },
    waterRequirementMm: 1200,
    criticalWaterStages: ["tillering", "flowering", "grain-fill"],
    fertilizerProfile: { n_kg_ha: 120, p_kg_ha: 60, k_kg_ha: 60, splitApplications: 3 },
    commonPests: [
      { name: "Rice Blast", tempTriggerMin: 24, tempTriggerMax: 28, humidityTrigger: 85 },
      { name: "Brown Planthopper", tempTriggerMin: 26, tempTriggerMax: 32 },
      { name: "Stem Borer", tempTriggerMin: 22, tempTriggerMax: 30 },
    ],
    source: "FAO Paper 56 (Allen 1998), IRRI Open Data",
  },
  "maize": {
    name: "Maize", category: "Cereals", emoji: "🌽",
    gddBase: 10,
    gddPhases: { germination: 60, establishment: 180, vegetative: 500, flowering: 750, fruitOrGrainSet: 1000, maturity: 1400 },
    tempRange: { min: 10, optimal: 25, max: 35 },
    waterRequirementMm: 500,
    criticalWaterStages: ["silking", "grain-fill"],
    fertilizerProfile: { n_kg_ha: 150, p_kg_ha: 75, k_kg_ha: 50, splitApplications: 3 },
    commonPests: [
      { name: "Fall Armyworm", tempTriggerMin: 20, tempTriggerMax: 32 },
      { name: "Stalk Borer", tempTriggerMin: 22, tempTriggerMax: 30 },
      { name: "Northern Leaf Blight", tempTriggerMin: 18, tempTriggerMax: 27, humidityTrigger: 80 },
    ],
    source: "USDA Agronomy Handbook, CIMMYT Open Data",
  },
  "wheat": {
    name: "Wheat", category: "Cereals", emoji: "🌾",
    gddBase: 0,
    gddPhases: { germination: 80, establishment: 200, vegetative: 600, flowering: 1000, fruitOrGrainSet: 1300, maturity: 1700 },
    tempRange: { min: 3, optimal: 18, max: 30 },
    waterRequirementMm: 450,
    criticalWaterStages: ["tillering", "heading"],
    fertilizerProfile: { n_kg_ha: 100, p_kg_ha: 60, k_kg_ha: 40, splitApplications: 2 },
    commonPests: [
      { name: "Rust (Stripe/Leaf)", tempTriggerMin: 10, tempTriggerMax: 20, humidityTrigger: 75 },
      { name: "Aphids", tempTriggerMin: 15, tempTriggerMax: 25 },
    ],
    source: "FAO Paper 56, CIMMYT Wheat Research Open Data",
  },
  "sorghum": {
    name: "Sorghum", category: "Cereals", emoji: "🌾",
    gddBase: 10,
    gddPhases: { germination: 60, establishment: 170, vegetative: 450, flowering: 700, fruitOrGrainSet: 950, maturity: 1250 },
    tempRange: { min: 12, optimal: 30, max: 40 },
    waterRequirementMm: 300,
    criticalWaterStages: ["boot-stage", "grain-fill"],
    fertilizerProfile: { n_kg_ha: 80, p_kg_ha: 40, k_kg_ha: 40, splitApplications: 2 },
    commonPests: [
      { name: "Sorghum Aphid", tempTriggerMin: 22, tempTriggerMax: 34 },
      { name: "Shoot Fly", tempTriggerMin: 26, tempTriggerMax: 35 },
    ],
    source: "ICRISAT Sorghum Open Research Data",
  },

  // ── Vegetables ────────────────────────────────────────────────────────────
  "tomato": {
    name: "Tomato", category: "Vegetables", emoji: "🍅",
    gddBase: 10,
    gddPhases: { germination: 80, establishment: 200, vegetative: 450, flowering: 700, fruitOrGrainSet: 950, maturity: 1200 },
    tempRange: { min: 10, optimal: 22, max: 32 },
    waterRequirementMm: 600,
    criticalWaterStages: ["flowering", "fruit-set", "fruit-sizing"],
    fertilizerProfile: { n_kg_ha: 180, p_kg_ha: 90, k_kg_ha: 200, splitApplications: 4 },
    commonPests: [
      { name: "Early Blight", tempTriggerMin: 24, tempTriggerMax: 30, humidityTrigger: 80 },
      { name: "Late Blight", tempTriggerMin: 12, tempTriggerMax: 20, humidityTrigger: 90 },
      { name: "Whitefly", tempTriggerMin: 22, tempTriggerMax: 33 },
    ],
    source: "FAO Horticultural Crops, AVRDC open datasets",
  },
  "eggplant": {
    name: "Eggplant", category: "Vegetables", emoji: "🍆",
    gddBase: 10,
    gddPhases: { germination: 90, establishment: 220, vegetative: 480, flowering: 720, fruitOrGrainSet: 950, maturity: 1150 },
    tempRange: { min: 15, optimal: 27, max: 35 },
    waterRequirementMm: 500,
    criticalWaterStages: ["flowering", "fruit-set"],
    fertilizerProfile: { n_kg_ha: 120, p_kg_ha: 60, k_kg_ha: 100, splitApplications: 3 },
    commonPests: [
      { name: "Eggplant Fruit & Shoot Borer", tempTriggerMin: 22, tempTriggerMax: 34 },
      { name: "Spider Mites", tempTriggerMin: 26, tempTriggerMax: 35 },
      { name: "Phomopsis Blight", tempTriggerMin: 20, tempTriggerMax: 30, humidityTrigger: 85 },
    ],
    source: "AVRDC (WorldVeg) Eggplant Research, open data",
  },
  "onion": {
    name: "Onion", category: "Vegetables", emoji: "🧅",
    gddBase: 7,
    gddPhases: { germination: 100, establishment: 250, vegetative: 600, flowering: 900, fruitOrGrainSet: 1100, maturity: 1400 },
    tempRange: { min: 7, optimal: 20, max: 28 },
    waterRequirementMm: 350,
    criticalWaterStages: ["bulb-initiation", "bulb-development"],
    fertilizerProfile: { n_kg_ha: 100, p_kg_ha: 60, k_kg_ha: 80, splitApplications: 3 },
    commonPests: [
      { name: "Thrips", tempTriggerMin: 22, tempTriggerMax: 32 },
      { name: "Purple Blotch", tempTriggerMin: 20, tempTriggerMax: 28, humidityTrigger: 80 },
    ],
    source: "AVRDC Vegetable Research Data",
  },
  "garlic": {
    name: "Garlic", category: "Vegetables", emoji: "🧄",
    gddBase: 7,
    gddPhases: { germination: 80, establishment: 200, vegetative: 550, flowering: 900, fruitOrGrainSet: 1100, maturity: 1450 },
    tempRange: { min: 5, optimal: 18, max: 26 },
    waterRequirementMm: 300,
    criticalWaterStages: ["bulb-development"],
    fertilizerProfile: { n_kg_ha: 80, p_kg_ha: 50, k_kg_ha: 80, splitApplications: 2 },
    commonPests: [
      { name: "Thrips", tempTriggerMin: 20, tempTriggerMax: 30 },
      { name: "Purple Blotch", tempTriggerMin: 18, tempTriggerMax: 26, humidityTrigger: 80 },
    ],
    source: "FAO Vegetable Production Guidelines",
  },
  "cabbage": {
    name: "Cabbage", category: "Vegetables", emoji: "🥬",
    gddBase: 7,
    gddPhases: { germination: 80, establishment: 200, vegetative: 450, flowering: 700, fruitOrGrainSet: 850, maturity: 1100 },
    tempRange: { min: 5, optimal: 16, max: 25 },
    waterRequirementMm: 380,
    criticalWaterStages: ["head-formation"],
    fertilizerProfile: { n_kg_ha: 120, p_kg_ha: 80, k_kg_ha: 100, splitApplications: 3 },
    commonPests: [
      { name: "Diamondback Moth", tempTriggerMin: 20, tempTriggerMax: 30 },
      { name: "Cabbage Aphid", tempTriggerMin: 15, tempTriggerMax: 25 },
    ],
    source: "FAO Vegetable Production Guidelines",
  },
  "carrot": {
    name: "Carrot", category: "Vegetables", emoji: "🥕",
    gddBase: 4,
    gddPhases: { germination: 90, establishment: 220, vegetative: 500, flowering: 800, fruitOrGrainSet: 950, maturity: 1150 },
    tempRange: { min: 7, optimal: 17, max: 25 },
    waterRequirementMm: 350,
    criticalWaterStages: ["root-thickening"],
    fertilizerProfile: { n_kg_ha: 60, p_kg_ha: 80, k_kg_ha: 120, splitApplications: 2 },
    commonPests: [
      { name: "Carrot Fly", tempTriggerMin: 12, tempTriggerMax: 20 },
      { name: "Alternaria Leaf Blight", tempTriggerMin: 20, tempTriggerMax: 28, humidityTrigger: 80 },
    ],
    source: "FAO Horticultural Crop Guidelines",
  },
  "ampalaya": {
    name: "Ampalaya (Bitter Melon)", category: "Vegetables", emoji: "🥒",
    gddBase: 12,
    gddPhases: { germination: 70, establishment: 190, vegetative: 420, flowering: 620, fruitOrGrainSet: 820, maturity: 1050 },
    tempRange: { min: 18, optimal: 28, max: 36 },
    waterRequirementMm: 450,
    criticalWaterStages: ["flowering", "fruit-set"],
    fertilizerProfile: { n_kg_ha: 80, p_kg_ha: 50, k_kg_ha: 80, splitApplications: 3 },
    commonPests: [
      { name: "Fruit Fly", tempTriggerMin: 24, tempTriggerMax: 34 },
      { name: "Powdery Mildew", tempTriggerMin: 18, tempTriggerMax: 28, humidityTrigger: 60 },
    ],
    source: "PCARRD / DA Philippines Crop Guides",
  },
  "okra": {
    name: "Okra", category: "Vegetables", emoji: "🫛",
    gddBase: 12,
    gddPhases: { germination: 60, establishment: 160, vegetative: 380, flowering: 580, fruitOrGrainSet: 760, maturity: 950 },
    tempRange: { min: 18, optimal: 28, max: 38 },
    waterRequirementMm: 300,
    criticalWaterStages: ["flowering", "pod-development"],
    fertilizerProfile: { n_kg_ha: 70, p_kg_ha: 40, k_kg_ha: 60, splitApplications: 2 },
    commonPests: [
      { name: "Aphids", tempTriggerMin: 20, tempTriggerMax: 30 },
      { name: "Root Knot Nematode", tempTriggerMin: 24, tempTriggerMax: 32 },
    ],
    source: "AVRDC Vegetable Research, open data",
  },
  "squash": {
    name: "Squash", category: "Vegetables", emoji: "🎃",
    gddBase: 10,
    gddPhases: { germination: 60, establishment: 170, vegetative: 400, flowering: 600, fruitOrGrainSet: 800, maturity: 1050 },
    tempRange: { min: 15, optimal: 26, max: 35 },
    waterRequirementMm: 400,
    criticalWaterStages: ["flowering", "fruit-set"],
    fertilizerProfile: { n_kg_ha: 80, p_kg_ha: 50, k_kg_ha: 80, splitApplications: 3 },
    commonPests: [
      { name: "Squash Vine Borer", tempTriggerMin: 22, tempTriggerMax: 32 },
      { name: "Powdery Mildew", tempTriggerMin: 20, tempTriggerMax: 28, humidityTrigger: 60 },
    ],
    source: "USDA Cucurbit Research, open-access",
  },
  "cucumber": {
    name: "Cucumber", category: "Vegetables", emoji: "🥒",
    gddBase: 10,
    gddPhases: { germination: 55, establishment: 160, vegetative: 380, flowering: 570, fruitOrGrainSet: 750, maturity: 950 },
    tempRange: { min: 15, optimal: 25, max: 34 },
    waterRequirementMm: 400,
    criticalWaterStages: ["flowering", "fruit-sizing"],
    fertilizerProfile: { n_kg_ha: 80, p_kg_ha: 50, k_kg_ha: 100, splitApplications: 3 },
    commonPests: [
      { name: "Downy Mildew", tempTriggerMin: 15, tempTriggerMax: 22, humidityTrigger: 85 },
      { name: "Cucumber Beetle", tempTriggerMin: 20, tempTriggerMax: 30 },
    ],
    source: "USDA Cucurbit Research, open-access",
  },
  "bell pepper": {
    name: "Bell Pepper", category: "Vegetables", emoji: "🫑",
    gddBase: 10,
    gddPhases: { germination: 90, establishment: 230, vegetative: 500, flowering: 750, fruitOrGrainSet: 1000, maturity: 1250 },
    tempRange: { min: 15, optimal: 22, max: 30 },
    waterRequirementMm: 500,
    criticalWaterStages: ["flowering", "fruit-set", "fruit-sizing"],
    fertilizerProfile: { n_kg_ha: 120, p_kg_ha: 70, k_kg_ha: 140, splitApplications: 4 },
    commonPests: [
      { name: "Phytophthora Blight", tempTriggerMin: 20, tempTriggerMax: 28, humidityTrigger: 90 },
      { name: "Pepper Weevil", tempTriggerMin: 22, tempTriggerMax: 32 },
    ],
    source: "FAO Horticultural Crops, AVRDC",
  },
  "chili": {
    name: "Chili", category: "Vegetables", emoji: "🌶️",
    gddBase: 10,
    gddPhases: { germination: 90, establishment: 220, vegetative: 480, flowering: 720, fruitOrGrainSet: 950, maturity: 1200 },
    tempRange: { min: 15, optimal: 25, max: 35 },
    waterRequirementMm: 450,
    criticalWaterStages: ["flowering", "fruit-set"],
    fertilizerProfile: { n_kg_ha: 100, p_kg_ha: 60, k_kg_ha: 120, splitApplications: 3 },
    commonPests: [
      { name: "Anthracnose", tempTriggerMin: 22, tempTriggerMax: 30, humidityTrigger: 85 },
      { name: "Thrips", tempTriggerMin: 22, tempTriggerMax: 34 },
    ],
    source: "AVRDC Pepper Research Data",
  },
  "pechay": {
    name: "Pechay", category: "Vegetables", emoji: "🥬",
    gddBase: 5,
    gddPhases: { germination: 40, establishment: 100, vegetative: 220, flowering: 350, fruitOrGrainSet: 450, maturity: 550 },
    tempRange: { min: 10, optimal: 22, max: 32 },
    waterRequirementMm: 200,
    criticalWaterStages: ["seedling-establishment"],
    fertilizerProfile: { n_kg_ha: 60, p_kg_ha: 30, k_kg_ha: 40, splitApplications: 2 },
    commonPests: [
      { name: "Diamondback Moth", tempTriggerMin: 18, tempTriggerMax: 30 },
      { name: "Cabbage Aphid", tempTriggerMin: 15, tempTriggerMax: 25 },
    ],
    source: "DA Philippines Leafy Vegetable Guidelines",
  },
  "mustasa": {
    name: "Mustasa", category: "Vegetables", emoji: "🥬",
    gddBase: 5,
    gddPhases: { germination: 40, establishment: 100, vegetative: 220, flowering: 340, fruitOrGrainSet: 430, maturity: 530 },
    tempRange: { min: 10, optimal: 20, max: 30 },
    waterRequirementMm: 180,
    criticalWaterStages: ["seedling-establishment"],
    fertilizerProfile: { n_kg_ha: 50, p_kg_ha: 25, k_kg_ha: 35, splitApplications: 2 },
    commonPests: [
      { name: "Diamondback Moth", tempTriggerMin: 18, tempTriggerMax: 30 },
      { name: "Aphids", tempTriggerMin: 15, tempTriggerMax: 26 },
    ],
    source: "DA Philippines Leafy Vegetable Guidelines",
  },
  "kangkong": {
    name: "Kangkong", category: "Vegetables", emoji: "🌿",
    gddBase: 12,
    gddPhases: { germination: 40, establishment: 90, vegetative: 200, flowering: 300, fruitOrGrainSet: 380, maturity: 450 },
    tempRange: { min: 22, optimal: 30, max: 38 },
    waterRequirementMm: 600,
    criticalWaterStages: ["seedling-establishment"],
    fertilizerProfile: { n_kg_ha: 40, p_kg_ha: 20, k_kg_ha: 30, splitApplications: 2 },
    commonPests: [
      { name: "Leaf Miner", tempTriggerMin: 22, tempTriggerMax: 32 },
      { name: "Aphids", tempTriggerMin: 20, tempTriggerMax: 30 },
    ],
    source: "DA Philippines Leafy Vegetable Guidelines",
  },
  "malunggay": {
    name: "Malunggay (Moringa)", category: "Vegetables", emoji: "🌿",
    gddBase: 15,
    gddPhases: { germination: 80, establishment: 250, vegetative: 700, flowering: 1200, fruitOrGrainSet: 1600, maturity: 2000 },
    tempRange: { min: 20, optimal: 28, max: 40 },
    waterRequirementMm: 250,
    criticalWaterStages: ["establishment"],
    fertilizerProfile: { n_kg_ha: 50, p_kg_ha: 25, k_kg_ha: 40, splitApplications: 2 },
    commonPests: [
      { name: "Aphids", tempTriggerMin: 20, tempTriggerMax: 32 },
      { name: "Termites (root)", tempTriggerMin: 25, tempTriggerMax: 38 },
    ],
    source: "Trees for Life / FAO Moringa Guidelines",
  },
  "sayote": {
    name: "Sayote (Chayote)", category: "Vegetables", emoji: "🫑",
    gddBase: 10,
    gddPhases: { germination: 80, establishment: 200, vegetative: 500, flowering: 780, fruitOrGrainSet: 1000, maturity: 1250 },
    tempRange: { min: 12, optimal: 22, max: 30 },
    waterRequirementMm: 450,
    criticalWaterStages: ["fruit-set"],
    fertilizerProfile: { n_kg_ha: 80, p_kg_ha: 50, k_kg_ha: 80, splitApplications: 3 },
    commonPests: [
      { name: "Fruit Fly", tempTriggerMin: 22, tempTriggerMax: 32 },
      { name: "Powdery Mildew", tempTriggerMin: 18, tempTriggerMax: 26, humidityTrigger: 60 },
    ],
    source: "PCARRD Vegetable Crops Research",
  },

  // ── Root Crops ─────────────────────────────────────────────────────────────
  "potato": {
    name: "Potato", category: "Tubers", emoji: "🥔",
    gddBase: 7,
    gddPhases: { germination: 120, establishment: 280, vegetative: 550, flowering: 800, fruitOrGrainSet: 1000, maturity: 1300 },
    tempRange: { min: 7, optimal: 18, max: 28 },
    waterRequirementMm: 500,
    criticalWaterStages: ["tuber-initiation", "tuber-bulking"],
    fertilizerProfile: { n_kg_ha: 140, p_kg_ha: 80, k_kg_ha: 180, splitApplications: 3 },
    commonPests: [
      { name: "Late Blight", tempTriggerMin: 10, tempTriggerMax: 20, humidityTrigger: 90 },
      { name: "Colorado Potato Beetle", tempTriggerMin: 15, tempTriggerMax: 28 },
    ],
    source: "International Potato Center (CIP) open data",
  },
  "cassava": {
    name: "Cassava", category: "Tubers", emoji: "🌱",
    gddBase: 18,
    gddPhases: { germination: 100, establishment: 300, vegetative: 1200, flowering: 2500, fruitOrGrainSet: 3500, maturity: 5000 },
    tempRange: { min: 18, optimal: 28, max: 38 },
    waterRequirementMm: 700,
    criticalWaterStages: ["establishment", "storage-root-initiation"],
    fertilizerProfile: { n_kg_ha: 80, p_kg_ha: 40, k_kg_ha: 100, splitApplications: 2 },
    commonPests: [
      { name: "Cassava Mosaic Virus", tempTriggerMin: 25, tempTriggerMax: 32 },
      { name: "Mealybug", tempTriggerMin: 26, tempTriggerMax: 34 },
    ],
    source: "IITA Cassava Open Research Data",
  },
  "sweet potato": {
    name: "Sweet Potato (Camote)", category: "Tubers", emoji: "🍠",
    gddBase: 10,
    gddPhases: { germination: 70, establishment: 180, vegetative: 500, flowering: 800, fruitOrGrainSet: 1000, maturity: 1300 },
    tempRange: { min: 15, optimal: 25, max: 35 },
    waterRequirementMm: 350,
    criticalWaterStages: ["storage-root-initiation", "tuber-fill"],
    fertilizerProfile: { n_kg_ha: 60, p_kg_ha: 50, k_kg_ha: 100, splitApplications: 2 },
    commonPests: [
      { name: "Sweet Potato Weevil", tempTriggerMin: 22, tempTriggerMax: 34 },
      { name: "Leaf Spot", tempTriggerMin: 20, tempTriggerMax: 30, humidityTrigger: 80 },
    ],
    source: "CIP Sweet Potato Research Data",
  },
  "taro": {
    name: "Taro (Gabi)", category: "Tubers", emoji: "🫚",
    gddBase: 12,
    gddPhases: { germination: 120, establishment: 300, vegetative: 800, flowering: 1400, fruitOrGrainSet: 1800, maturity: 2200 },
    tempRange: { min: 18, optimal: 28, max: 35 },
    waterRequirementMm: 1200,
    criticalWaterStages: ["corm-initiation", "corm-expansion"],
    fertilizerProfile: { n_kg_ha: 80, p_kg_ha: 50, k_kg_ha: 100, splitApplications: 3 },
    commonPests: [
      { name: "Taro Leaf Blight", tempTriggerMin: 22, tempTriggerMax: 30, humidityTrigger: 85 },
      { name: "Aphids", tempTriggerMin: 20, tempTriggerMax: 30 },
    ],
    source: "FAO Root & Tuber Crop Guidelines",
  },
  "ube": {
    name: "Ube (Purple Yam)", category: "Tubers", emoji: "🫐",
    gddBase: 12,
    gddPhases: { germination: 130, establishment: 320, vegetative: 900, flowering: 1500, fruitOrGrainSet: 1900, maturity: 2400 },
    tempRange: { min: 18, optimal: 27, max: 35 },
    waterRequirementMm: 900,
    criticalWaterStages: ["tuber-initiation", "tuber-fill"],
    fertilizerProfile: { n_kg_ha: 70, p_kg_ha: 50, k_kg_ha: 120, splitApplications: 3 },
    commonPests: [
      { name: "Yam Beetle", tempTriggerMin: 22, tempTriggerMax: 32 },
      { name: "Anthracnose", tempTriggerMin: 20, tempTriggerMax: 30, humidityTrigger: 85 },
    ],
    source: "DA Philippines Root Crop Programs",
  },

  // ── Fruits ────────────────────────────────────────────────────────────────
  "banana": {
    name: "Banana", category: "Fruits", emoji: "🍌",
    gddBase: 15,
    gddPhases: { germination: 0, establishment: 400, vegetative: 2000, flowering: 3500, fruitOrGrainSet: 4500, maturity: 5500 },
    tempRange: { min: 15, optimal: 27, max: 36 },
    waterRequirementMm: 1200,
    criticalWaterStages: ["bunch-emergence", "fruit-fill"],
    fertilizerProfile: { n_kg_ha: 200, p_kg_ha: 80, k_kg_ha: 400, splitApplications: 6 },
    commonPests: [
      { name: "Black Sigatoka", tempTriggerMin: 24, tempTriggerMax: 30, humidityTrigger: 80 },
      { name: "Banana Weevil", tempTriggerMin: 22, tempTriggerMax: 32 },
    ],
    source: "INIBAP (Bioversity International) open banana research",
  },
  "mango": {
    name: "Mango", category: "Fruits", emoji: "🥭",
    gddBase: 15,
    gddPhases: { germination: 150, establishment: 600, vegetative: 2500, flowering: 4000, fruitOrGrainSet: 5000, maturity: 6500 },
    tempRange: { min: 18, optimal: 28, max: 38 },
    waterRequirementMm: 900,
    criticalWaterStages: ["flowering", "fruit-development"],
    fertilizerProfile: { n_kg_ha: 150, p_kg_ha: 60, k_kg_ha: 180, splitApplications: 3 },
    commonPests: [
      { name: "Mango Anthracnose", tempTriggerMin: 22, tempTriggerMax: 30, humidityTrigger: 80 },
      { name: "Mango Pulp Weevil", tempTriggerMin: 24, tempTriggerMax: 34 },
      { name: "Thrips", tempTriggerMin: 22, tempTriggerMax: 34 },
    ],
    source: "PCARRD / PhilMango Research Data",
  },
  "pineapple": {
    name: "Pineapple", category: "Fruits", emoji: "🍍",
    gddBase: 15,
    gddPhases: { germination: 0, establishment: 800, vegetative: 3000, flowering: 5000, fruitOrGrainSet: 6500, maturity: 8000 },
    tempRange: { min: 15, optimal: 26, max: 36 },
    waterRequirementMm: 700,
    criticalWaterStages: ["forcing", "fruit-development"],
    fertilizerProfile: { n_kg_ha: 400, p_kg_ha: 100, k_kg_ha: 500, splitApplications: 6 },
    commonPests: [
      { name: "Mealybug Wilt", tempTriggerMin: 24, tempTriggerMax: 34 },
      { name: "Heart Rot (Phytophthora)", tempTriggerMin: 18, tempTriggerMax: 28, humidityTrigger: 85 },
    ],
    source: "FFTC / DA Pineapple Research Data",
  },
  "papaya": {
    name: "Papaya", category: "Fruits", emoji: "🍑",
    gddBase: 15,
    gddPhases: { germination: 100, establishment: 350, vegetative: 1200, flowering: 2200, fruitOrGrainSet: 3000, maturity: 4000 },
    tempRange: { min: 18, optimal: 27, max: 35 },
    waterRequirementMm: 800,
    criticalWaterStages: ["flowering", "fruit-development"],
    fertilizerProfile: { n_kg_ha: 150, p_kg_ha: 60, k_kg_ha: 180, splitApplications: 4 },
    commonPests: [
      { name: "Papaya Ringspot Virus", tempTriggerMin: 22, tempTriggerMax: 32 },
      { name: "Fruit Fly", tempTriggerMin: 24, tempTriggerMax: 34 },
    ],
    source: "PCARRD Fruit Crop Research",
  },
  "watermelon": {
    name: "Watermelon", category: "Fruits", emoji: "🍉",
    gddBase: 15,
    gddPhases: { germination: 60, establishment: 180, vegetative: 450, flowering: 650, fruitOrGrainSet: 850, maturity: 1200 },
    tempRange: { min: 18, optimal: 28, max: 35 },
    waterRequirementMm: 500,
    criticalWaterStages: ["flowering", "fruit-set"],
    fertilizerProfile: { n_kg_ha: 100, p_kg_ha: 60, k_kg_ha: 120, splitApplications: 3 },
    commonPests: [
      { name: "Fusarium Wilt", tempTriggerMin: 22, tempTriggerMax: 28 },
      { name: "Aphids (Mosaic Vector)", tempTriggerMin: 20, tempTriggerMax: 30 },
    ],
    source: "USDA Cucurbit Research, open-access",
  },
  "calamansi": {
    name: "Calamansi", category: "Fruits", emoji: "🍋",
    gddBase: 12,
    gddPhases: { germination: 200, establishment: 800, vegetative: 3000, flowering: 5000, fruitOrGrainSet: 6500, maturity: 8000 },
    tempRange: { min: 15, optimal: 26, max: 34 },
    waterRequirementMm: 800,
    criticalWaterStages: ["flowering", "fruit-development"],
    fertilizerProfile: { n_kg_ha: 120, p_kg_ha: 60, k_kg_ha: 140, splitApplications: 3 },
    commonPests: [
      { name: "Citrus Canker", tempTriggerMin: 22, tempTriggerMax: 30, humidityTrigger: 80 },
      { name: "Citrus Psyllid", tempTriggerMin: 20, tempTriggerMax: 32 },
    ],
    source: "DA Philippines Citrus Crop Guide",
  },
  "coconut": {
    name: "Coconut", category: "Fruits", emoji: "🥥",
    gddBase: 15,
    gddPhases: { germination: 200, establishment: 1200, vegetative: 5000, flowering: 9000, fruitOrGrainSet: 12000, maturity: 15000 },
    tempRange: { min: 20, optimal: 28, max: 36 },
    waterRequirementMm: 1500,
    criticalWaterStages: ["establishment", "nut-development"],
    fertilizerProfile: { n_kg_ha: 120, p_kg_ha: 50, k_kg_ha: 200, splitApplications: 2 },
    commonPests: [
      { name: "Coconut Scale Insect", tempTriggerMin: 22, tempTriggerMax: 34 },
      { name: "Rhinoceros Beetle", tempTriggerMin: 24, tempTriggerMax: 35 },
      { name: "Cadang-Cadang Viroid", tempTriggerMin: 24, tempTriggerMax: 32 },
    ],
    source: "Philippine Coconut Authority (PCA) open research",
  },
  "avocado": {
    name: "Avocado", category: "Fruits", emoji: "🥑",
    gddBase: 10,
    gddPhases: { germination: 200, establishment: 700, vegetative: 2500, flowering: 4000, fruitOrGrainSet: 5500, maturity: 7000 },
    tempRange: { min: 12, optimal: 24, max: 32 },
    waterRequirementMm: 900,
    criticalWaterStages: ["flowering", "fruit-fill"],
    fertilizerProfile: { n_kg_ha: 130, p_kg_ha: 60, k_kg_ha: 160, splitApplications: 3 },
    commonPests: [
      { name: "Avocado Root Rot (Phytophthora)", tempTriggerMin: 18, tempTriggerMax: 26, humidityTrigger: 85 },
      { name: "Fruit Fly", tempTriggerMin: 22, tempTriggerMax: 32 },
    ],
    source: "CAB International Avocado Research Data",
  },
  "dragon fruit": {
    name: "Dragon Fruit", category: "Fruits", emoji: "🐉",
    gddBase: 12,
    gddPhases: { germination: 50, establishment: 200, vegetative: 600, flowering: 1000, fruitOrGrainSet: 1200, maturity: 1450 },
    tempRange: { min: 18, optimal: 28, max: 40 },
    waterRequirementMm: 400,
    criticalWaterStages: ["flowering", "fruit-set"],
    fertilizerProfile: { n_kg_ha: 80, p_kg_ha: 50, k_kg_ha: 100, splitApplications: 4 },
    commonPests: [
      { name: "Anthracnose", tempTriggerMin: 22, tempTriggerMax: 30, humidityTrigger: 85 },
      { name: "Scale Insects", tempTriggerMin: 24, tempTriggerMax: 36 },
    ],
    source: "PCARRD Fruit Crop Research / DA Philippines",
  },
  "jackfruit": {
    name: "Jackfruit", category: "Fruits", emoji: "🍈",
    gddBase: 15,
    gddPhases: { germination: 180, establishment: 700, vegetative: 2800, flowering: 4500, fruitOrGrainSet: 6000, maturity: 7500 },
    tempRange: { min: 18, optimal: 27, max: 38 },
    waterRequirementMm: 1000,
    criticalWaterStages: ["flowering", "fruit-development"],
    fertilizerProfile: { n_kg_ha: 120, p_kg_ha: 60, k_kg_ha: 150, splitApplications: 3 },
    commonPests: [
      { name: "Fruit Borer", tempTriggerMin: 22, tempTriggerMax: 34 },
      { name: "Jack Fruit Die-Back", tempTriggerMin: 24, tempTriggerMax: 32, humidityTrigger: 80 },
    ],
    source: "PCARRD Tropical Fruit Research",
  },
  "guava": {
    name: "Guava", category: "Fruits", emoji: "🍐",
    gddBase: 12,
    gddPhases: { germination: 130, establishment: 450, vegetative: 1500, flowering: 2500, fruitOrGrainSet: 3200, maturity: 4000 },
    tempRange: { min: 15, optimal: 26, max: 38 },
    waterRequirementMm: 700,
    criticalWaterStages: ["flowering", "fruit-development"],
    fertilizerProfile: { n_kg_ha: 100, p_kg_ha: 50, k_kg_ha: 120, splitApplications: 3 },
    commonPests: [
      { name: "Fruit Fly", tempTriggerMin: 22, tempTriggerMax: 34 },
      { name: "Guava Wilt (Fusarium)", tempTriggerMin: 24, tempTriggerMax: 32 },
    ],
    source: "PCARRD Tropical Fruit Research",
  },

  // ── Legumes ────────────────────────────────────────────────────────────────
  "soybean": {
    name: "Soybean", category: "Legumes", emoji: "🫘",
    gddBase: 10,
    gddPhases: { germination: 60, establishment: 180, vegetative: 450, flowering: 700, fruitOrGrainSet: 1000, maturity: 1350 },
    tempRange: { min: 10, optimal: 24, max: 34 },
    waterRequirementMm: 450,
    criticalWaterStages: ["flowering", "pod-fill"],
    fertilizerProfile: { n_kg_ha: 30, p_kg_ha: 60, k_kg_ha: 60, splitApplications: 1 },
    commonPests: [
      { name: "Soybean Rust", tempTriggerMin: 18, tempTriggerMax: 26, humidityTrigger: 75 },
      { name: "Stink Bug", tempTriggerMin: 22, tempTriggerMax: 32 },
    ],
    source: "USDA ARS Soybean Research",
  },
  "groundnut": {
    name: "Groundnut / Peanut", category: "Legumes", emoji: "🥜",
    gddBase: 10,
    gddPhases: { germination: 70, establishment: 200, vegetative: 450, flowering: 700, fruitOrGrainSet: 1000, maturity: 1300 },
    tempRange: { min: 18, optimal: 28, max: 35 },
    waterRequirementMm: 450,
    criticalWaterStages: ["pegging", "pod-fill"],
    fertilizerProfile: { n_kg_ha: 20, p_kg_ha: 60, k_kg_ha: 40, splitApplications: 2 },
    commonPests: [
      { name: "Early Leaf Spot", tempTriggerMin: 25, tempTriggerMax: 30, humidityTrigger: 80 },
      { name: "Groundnut Rosette Virus", tempTriggerMin: 22, tempTriggerMax: 30 },
    ],
    source: "ICRISAT Groundnut Open Research Data",
  },
  "mung bean": {
    name: "Mung Bean (Mungo)", category: "Legumes", emoji: "🫘",
    gddBase: 10,
    gddPhases: { germination: 50, establishment: 140, vegetative: 350, flowering: 550, fruitOrGrainSet: 750, maturity: 950 },
    tempRange: { min: 20, optimal: 28, max: 38 },
    waterRequirementMm: 250,
    criticalWaterStages: ["flowering", "pod-fill"],
    fertilizerProfile: { n_kg_ha: 15, p_kg_ha: 40, k_kg_ha: 30, splitApplications: 1 },
    commonPests: [
      { name: "Bean Fly", tempTriggerMin: 22, tempTriggerMax: 34 },
      { name: "Powdery Mildew", tempTriggerMin: 22, tempTriggerMax: 30, humidityTrigger: 60 },
    ],
    source: "AVRDC Pulse Crop Research Data",
  },
  "string beans": {
    name: "String Beans (Sitaw)", category: "Vegetables", emoji: "🫘",
    gddBase: 10,
    gddPhases: { germination: 55, establishment: 150, vegetative: 360, flowering: 560, fruitOrGrainSet: 730, maturity: 920 },
    tempRange: { min: 18, optimal: 26, max: 34 },
    waterRequirementMm: 350,
    criticalWaterStages: ["flowering", "pod-set"],
    fertilizerProfile: { n_kg_ha: 20, p_kg_ha: 50, k_kg_ha: 50, splitApplications: 2 },
    commonPests: [
      { name: "Bean Aphid", tempTriggerMin: 18, tempTriggerMax: 28 },
      { name: "Pod Borer", tempTriggerMin: 22, tempTriggerMax: 32 },
    ],
    source: "AVRDC Vegetable Research",
  },

  // ── Cash Crops ─────────────────────────────────────────────────────────────
  "coffee": {
    name: "Coffee", category: "Cash Crops", emoji: "☕",
    gddBase: 15,
    gddPhases: { germination: 200, establishment: 800, vegetative: 3000, flowering: 4500, fruitOrGrainSet: 6000, maturity: 8000 },
    tempRange: { min: 15, optimal: 22, max: 30 },
    waterRequirementMm: 1500,
    criticalWaterStages: ["flowering", "fruit-development"],
    fertilizerProfile: { n_kg_ha: 150, p_kg_ha: 60, k_kg_ha: 140, splitApplications: 3 },
    commonPests: [
      { name: "Coffee Berry Borer", tempTriggerMin: 22, tempTriggerMax: 30 },
      { name: "Coffee Leaf Rust", tempTriggerMin: 20, tempTriggerMax: 28, humidityTrigger: 80 },
    ],
    source: "World Coffee Research open data",
  },
  "sugarcane": {
    name: "Sugarcane", category: "Cash Crops", emoji: "🌿",
    gddBase: 18,
    gddPhases: { germination: 150, establishment: 500, vegetative: 2000, flowering: 4000, fruitOrGrainSet: 5000, maturity: 7000 },
    tempRange: { min: 18, optimal: 30, max: 38 },
    waterRequirementMm: 1500,
    criticalWaterStages: ["germination", "grand-growth"],
    fertilizerProfile: { n_kg_ha: 200, p_kg_ha: 80, k_kg_ha: 200, splitApplications: 3 },
    commonPests: [
      { name: "Sugarcane Borer", tempTriggerMin: 25, tempTriggerMax: 35 },
      { name: "Wooly Aphid", tempTriggerMin: 22, tempTriggerMax: 32 },
    ],
    source: "ISSCT open data",
  },

  // ── Herbs & Spices ─────────────────────────────────────────────────────────
  "ginger": {
    name: "Ginger", category: "Herbs & Spices", emoji: "🫚",
    gddBase: 12,
    gddPhases: { germination: 120, establishment: 350, vegetative: 900, flowering: 1500, fruitOrGrainSet: 1900, maturity: 2400 },
    tempRange: { min: 20, optimal: 28, max: 35 },
    waterRequirementMm: 900,
    criticalWaterStages: ["establishment", "rhizome-development"],
    fertilizerProfile: { n_kg_ha: 100, p_kg_ha: 60, k_kg_ha: 120, splitApplications: 3 },
    commonPests: [
      { name: "Ginger Rhizome Rot (Pythium)", tempTriggerMin: 22, tempTriggerMax: 30, humidityTrigger: 85 },
      { name: "Shoot Borer", tempTriggerMin: 24, tempTriggerMax: 34 },
    ],
    source: "FFTC / PCARRD Spice Crop Research",
  },
  "turmeric": {
    name: "Turmeric", category: "Herbs & Spices", emoji: "🟡",
    gddBase: 12,
    gddPhases: { germination: 130, establishment: 380, vegetative: 1000, flowering: 1700, fruitOrGrainSet: 2100, maturity: 2600 },
    tempRange: { min: 20, optimal: 28, max: 36 },
    waterRequirementMm: 900,
    criticalWaterStages: ["establishment", "rhizome-development"],
    fertilizerProfile: { n_kg_ha: 80, p_kg_ha: 50, k_kg_ha: 100, splitApplications: 2 },
    commonPests: [
      { name: "Rhizome Rot", tempTriggerMin: 22, tempTriggerMax: 30, humidityTrigger: 85 },
      { name: "Leaf Blotch", tempTriggerMin: 22, tempTriggerMax: 30, humidityTrigger: 80 },
    ],
    source: "FAO Spice Crops Guidelines",
  },
  "lemongrass": {
    name: "Lemongrass", category: "Herbs & Spices", emoji: "🌿",
    gddBase: 12,
    gddPhases: { germination: 80, establishment: 250, vegetative: 700, flowering: 1200, fruitOrGrainSet: 1500, maturity: 1800 },
    tempRange: { min: 18, optimal: 28, max: 38 },
    waterRequirementMm: 500,
    criticalWaterStages: ["establishment"],
    fertilizerProfile: { n_kg_ha: 60, p_kg_ha: 30, k_kg_ha: 60, splitApplications: 3 },
    commonPests: [
      { name: "Rust", tempTriggerMin: 18, tempTriggerMax: 26, humidityTrigger: 80 },
      { name: "Leaf Spot", tempTriggerMin: 22, tempTriggerMax: 30, humidityTrigger: 80 },
    ],
    source: "DA Philippines Herbs & Spices Program",
  },
  "basil": {
    name: "Basil", category: "Herbs & Spices", emoji: "🌿",
    gddBase: 10,
    gddPhases: { germination: 40, establishment: 100, vegetative: 250, flowering: 400, fruitOrGrainSet: 500, maturity: 620 },
    tempRange: { min: 15, optimal: 24, max: 32 },
    waterRequirementMm: 300,
    criticalWaterStages: ["seedling-establishment"],
    fertilizerProfile: { n_kg_ha: 40, p_kg_ha: 25, k_kg_ha: 35, splitApplications: 3 },
    commonPests: [
      { name: "Fusarium Wilt", tempTriggerMin: 22, tempTriggerMax: 30 },
      { name: "Aphids", tempTriggerMin: 18, tempTriggerMax: 28 },
    ],
    source: "FAO Herb Crop Guidelines",
  },

  // ── Oilseeds ───────────────────────────────────────────────────────────────
  "sunflower": {
    name: "Sunflower", category: "Oilseeds", emoji: "🌻",
    gddBase: 10,
    gddPhases: { germination: 60, establishment: 180, vegetative: 450, flowering: 750, fruitOrGrainSet: 1000, maturity: 1350 },
    tempRange: { min: 10, optimal: 24, max: 34 },
    waterRequirementMm: 400,
    criticalWaterStages: ["flowering", "seed-fill"],
    fertilizerProfile: { n_kg_ha: 80, p_kg_ha: 60, k_kg_ha: 50, splitApplications: 2 },
    commonPests: [
      { name: "Downy Mildew", tempTriggerMin: 15, tempTriggerMax: 22, humidityTrigger: 85 },
      { name: "Sclerotinia", tempTriggerMin: 16, tempTriggerMax: 24, humidityTrigger: 80 },
    ],
    source: "National Sunflower Association open research data",
  },
  "cotton": {
    name: "Cotton", category: "Cash Crops", emoji: "🌿",
    gddBase: 15.6,
    gddPhases: { germination: 55, establishment: 180, vegetative: 500, flowering: 800, fruitOrGrainSet: 1200, maturity: 1600 },
    tempRange: { min: 15, optimal: 28, max: 38 },
    waterRequirementMm: 700,
    criticalWaterStages: ["squaring", "flowering", "boll-development"],
    fertilizerProfile: { n_kg_ha: 120, p_kg_ha: 60, k_kg_ha: 80, splitApplications: 3 },
    commonPests: [
      { name: "Bollworm", tempTriggerMin: 22, tempTriggerMax: 35 },
      { name: "Aphids", tempTriggerMin: 18, tempTriggerMax: 28 },
    ],
    source: "ICAC open data",
  },
};

/**
 * Aliases — all PH local names and common spelling variations map to profile keys.
 */
const ALIASES: Record<string, string> = {
  // English/Filipino alternates
  "corn": "maize", "corn / maize": "maize", "corn/maize": "maize", "corn – yellow": "maize", "corn – white": "maize",
  "peanut": "groundnut", "groundnut": "groundnut", "peanut / groundnut": "groundnut", "mani": "groundnut",
  "tomatoes": "tomato", "kamatis": "tomato",
  "potatoes": "potato", "patatas": "potato",
  "soybeans": "soybean", "soya": "soybean",
  "bananas": "banana", "saging": "banana",
  "watermelons": "watermelon", "pakwan": "watermelon",
  "coffees": "coffee",
  "cottons": "cotton",
  "sweet potato": "sweet potato", "camote": "sweet potato", "sweet potato (camote)": "sweet potato",
  "kamote": "sweet potato",
  "cassavas": "cassava", "kamoteng kahoy": "cassava",
  "taro": "taro", "gabi": "taro", "taro (gabi)": "taro",
  "ube (purple yam)": "ube", "purple yam": "ube",
  "mango": "mango", "mangga": "mango",
  "papaya": "papaya",
  "pineapple": "pineapple", "pinya": "pineapple",
  "calamansi": "calamansi", "kalamansi": "calamansi",
  "coconut": "coconut", "niyog": "coconut",
  "avocado": "avocado", "abokado": "avocado",
  "dragon fruit": "dragon fruit", "pitaya": "dragon fruit",
  "jackfruit": "jackfruit", "langka": "jackfruit",
  "guava": "guava", "bayabas": "guava",
  "eggplant": "eggplant", "talong": "eggplant",
  "onion": "onion", "sibuyas": "onion",
  "garlic": "garlic", "bawang": "garlic",
  "cabbage": "cabbage", "repolyo": "cabbage",
  "carrot": "carrot", "karot": "carrot",
  "ampalaya (bitter melon)": "ampalaya", "bitter melon": "ampalaya", "ampalaya": "ampalaya",
  "okra": "okra",
  "squash": "squash", "kalabasa": "squash",
  "cucumber": "cucumber", "pipino": "cucumber",
  "bell pepper": "bell pepper", "kampanilya": "bell pepper",
  "chili": "chili", "sili": "chili", "labuyo": "chili",
  "pechay": "pechay", "bok choy": "pechay",
  "mustasa": "mustasa",
  "kangkong": "kangkong",
  "malunggay": "malunggay", "moringa": "malunggay",
  "sayote": "sayote", "chayote": "sayote",
  "string beans": "string beans", "sitaw": "string beans",
  "mung bean": "mung bean", "mungo": "mung bean", "munggo": "mung bean",
  "mung beans": "mung bean",
  "ginger": "ginger", "luya": "ginger",
  "turmeric": "turmeric", "dilaw": "turmeric", "luyang dilaw": "turmeric",
  "lemongrass": "lemongrass", "tanglad": "lemongrass",
  "basil": "basil", "balanoy": "basil",
  "sorghum": "sorghum",
  "rice": "rice", "palay": "rice",
  "sugarcane": "sugarcane",
  "coffee": "coffee",
};

function lookupCrop(name: string): CropGDDProfile | null {
  const key = name.toLowerCase().trim();
  const resolved = ALIASES[key] ?? key;
  return CROP_GDD_PROFILES[resolved] ?? null;
}

/**
 * Build a generic profile for unknown crops using available climate data.
 */
function buildGenericProfile(cropName: string): CropGDDProfile {
  const n = cropName.toLowerCase();
  const isTropical = /cass|banana|mango|coconut|cacao|cocoa|yam|durian|rambutan|langka|jackfruit|lanzones|mangosteen/.test(n);
  const isLegume = /bean|pea|lentil|chickpea|cowpea|legume/.test(n);
  const isCereal = /millet|sorghum|barley|oat|teff|cereal/.test(n);
  const isVegetable = /carrot|spinach|kale|lettuce|pepper|cucumber|zucchini|radish|broccoli|cauliflower|patola|upo/.test(n);
  const isHerb = /herb|basil|mint|oregano|cilantro|parsley|thyme/.test(n);
  const isRhizome = /ginger|turmeric|galangal/.test(n);

  const gddBase = isTropical ? 15 : isLegume ? 10 : isCereal ? 8 : isVegetable ? 8 : isHerb ? 8 : isRhizome ? 12 : 10;
  const scale = isTropical ? 1.8 : isLegume ? 0.9 : isCereal ? 1.0 : isVegetable ? 0.75 : isHerb ? 0.5 : isRhizome ? 1.5 : 1.0;

  return {
    name: cropName,
    category: isTropical ? "Tropical Fruits" : isLegume ? "Legumes" : isCereal ? "Cereals" : isVegetable ? "Vegetables" : isHerb ? "Herbs" : isRhizome ? "Herbs & Spices" : "Field Crops",
    emoji: "🌱",
    gddBase,
    gddPhases: {
      germination: Math.round(70 * scale),
      establishment: Math.round(200 * scale),
      vegetative: Math.round(500 * scale),
      flowering: Math.round(800 * scale),
      fruitOrGrainSet: Math.round(1100 * scale),
      maturity: Math.round(1400 * scale),
    },
    tempRange: { min: gddBase, optimal: gddBase + 15, max: gddBase + 25 },
    waterRequirementMm: isTropical ? 1000 : isRhizome ? 800 : 450,
    criticalWaterStages: ["flowering", "grain-fill"],
    fertilizerProfile: { n_kg_ha: 80, p_kg_ha: 50, k_kg_ha: 80, splitApplications: 2 },
    commonPests: [
      { name: "Aphids", tempTriggerMin: 15, tempTriggerMax: 28 },
      { name: "Fungal Disease", tempTriggerMin: 18, tempTriggerMax: 28, humidityTrigger: 80 },
    ],
    source: "Estimated from agronomic principles (FAO general crop guidelines)",
  };
}

function computeDayFromGDD(gddThreshold: number, avgDailyGDD: number): number {
  if (avgDailyGDD <= 0) return Math.round(gddThreshold / 8);
  return Math.round(gddThreshold / avgDailyGDD);
}

function computeET0(lat: number, tmax: number, tmin: number, doy: number): number {
  const tmean = (tmax + tmin) / 2;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * doy);
  const delta = 0.409 * Math.sin((2 * Math.PI / 365) * doy - 1.39);
  const phi = (lat * Math.PI) / 180;
  const ws = Math.acos(-Math.tan(phi) * Math.tan(delta));
  const Ra = (24 / Math.PI) * 0.082 * dr * (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
  return Math.max(0, 0.0023 * (tmean + 17.8) * Math.sqrt(Math.max(0, tmax - tmin)) * Ra);
}

function getCropCoefficient(phase: string): number {
  const kc: Record<string, number> = {
    germination: 0.4, establishment: 0.7, vegetative: 1.0,
    flowering: 1.15, fruitOrGrainSet: 1.1, maturity: 0.8,
  };
  return kc[phase] ?? 1.0;
}

function assessWeatherRisk(forecast: ForecastDay[], crop: CropGDDProfile): { level: string; notes: string } {
  let highTemp = 0, lowTemp = 0, heavyRain = 0;
  for (const day of forecast.slice(0, 7)) {
    if (day.tempMax > crop.tempRange.max) highTemp++;
    if (day.tempMin < crop.tempRange.min) lowTemp++;
    if (day.precipitation > 25) heavyRain++;
  }
  if (highTemp >= 3 || lowTemp >= 3) return { level: "high", notes: `${highTemp > 0 ? `High temperature stress expected (${highTemp} days above ${crop.tempRange.max}°C). ` : ""}${lowTemp > 0 ? `Cold stress expected (${lowTemp} nights below ${crop.tempRange.min}°C). ` : ""}` };
  if (heavyRain >= 2) return { level: "medium", notes: "Heavy rainfall forecast — ensure drainage and delay pesticide application." };
  if (highTemp >= 1 || lowTemp >= 1) return { level: "medium", notes: "Some temperature stress possible. Monitor crop closely." };
  return { level: "low", notes: "Weather conditions are generally favorable for this crop." };
}

export interface FarmingPlanOutput {
  crop: string;
  location: string;
  plantingDate: string;
  totalGrowingDays: number;
  estimatedHarvestStart: number;
  estimatedHarvestEnd: number;
  weatherRiskLevel: string;
  weatherRiskNotes: string;
  varietyRecommendation: string;
  expectedYield: string;
  cropInfo: string;
  dataSourcesUsed: string[];
  climateAdaptedNote: string;
  stages: any[];
  milestones: any[];
  weatherAdjustments: any[];
  fertilizerSchedule: any[];
  pestAlerts: any[];
  irrigationSchedule: any[];
}

const BASE_YIELDS: Record<string, string> = {
  rice: "4-6 tons/ha", maize: "3-7 tons/ha", wheat: "2-5 tons/ha",
  tomato: "30-60 tons/ha", potato: "15-30 tons/ha", cassava: "8-20 tons/ha",
  soybean: "1.5-3.5 tons/ha", groundnut: "1.5-3 tons/ha", eggplant: "15-30 tons/ha",
  onion: "10-20 tons/ha", cabbage: "20-40 tons/ha", carrot: "15-25 tons/ha",
  watermelon: "20-40 tons/ha", banana: "20-40 tons/ha", mango: "5-10 tons/ha",
  pineapple: "30-50 tons/ha", papaya: "30-60 tons/ha", sugarcane: "60-100 tons/ha",
  "sweet potato": "10-20 tons/ha", taro: "8-15 tons/ha", ube: "6-12 tons/ha",
  "mung bean": "0.8-1.5 tons/ha", pechay: "10-20 tons/ha",
  ampalaya: "8-15 tons/ha", okra: "5-10 tons/ha", squash: "15-25 tons/ha",
  cucumber: "15-25 tons/ha", ginger: "8-15 tons/ha", turmeric: "10-18 tons/ha",
  "dragon fruit": "15-25 tons/ha", coconut: "6-12 tons/ha (nuts)",
};

export function generateFarmingPlan(
  cropName: string,
  plantingDate: string,
  location: string,
  climate: ClimateProfile,
  forecast: ForecastDay[],
  wikiInfo: string | null
): FarmingPlanOutput {
  const profile = lookupCrop(cropName) ?? buildGenericProfile(cropName);
  const avgGDD = Math.max(3, climate.avgDailyGDD);

  const days = {
    germination: computeDayFromGDD(profile.gddPhases.germination, avgGDD),
    establishment: computeDayFromGDD(profile.gddPhases.establishment, avgGDD),
    vegetative: computeDayFromGDD(profile.gddPhases.vegetative, avgGDD),
    flowering: computeDayFromGDD(profile.gddPhases.flowering, avgGDD),
    fruitSet: computeDayFromGDD(profile.gddPhases.fruitOrGrainSet, avgGDD),
    maturity: computeDayFromGDD(profile.gddPhases.maturity, avgGDD),
  };

  const totalGrowingDays = days.maturity;
  const harvestWindow = Math.round(totalGrowingDays * 0.07);
  const plantDate = new Date(plantingDate);
  const doy = Math.floor((plantDate.getTime() - new Date(plantDate.getFullYear(), 0, 0).getTime()) / 86400000);

  const riskAssessment = assessWeatherRisk(forecast, profile);

  const tempAtLocation = climate.annualMeanTemp;
  const isSuboptimal = tempAtLocation < profile.tempRange.min + 3 || tempAtLocation > profile.tempRange.max - 3;
  const varietyNote = isSuboptimal
    ? `Choose a variety adapted to ${tempAtLocation > profile.tempRange.optimal ? "warm/hot" : "cool"} conditions (mean temp: ${climate.annualMeanTemp}°C). Consult local extension service for certified varieties.`
    : `Standard varieties perform well in ${location} (mean temp: ${climate.annualMeanTemp}°C, optimal for ${profile.name}: ${profile.tempRange.optimal}°C).`;

  const yieldModifier = isSuboptimal ? 0.75 : 1.0;
  const profileKey = Object.keys(BASE_YIELDS).find((k) => profile.name.toLowerCase().includes(k));
  const expectedYield = profileKey
    ? (isSuboptimal ? `${BASE_YIELDS[profileKey]} (reduced — suboptimal temperature)` : BASE_YIELDS[profileKey])
    : `Estimated ${Math.round(2 * yieldModifier * 10) / 10}-${Math.round(5 * yieldModifier * 10) / 10} tons/ha based on local climate`;

  const fertNPerApp = Math.round(profile.fertilizerProfile.n_kg_ha / profile.fertilizerProfile.splitApplications);
  const fertPTotal = profile.fertilizerProfile.p_kg_ha;
  const fertKPerApp = Math.round(profile.fertilizerProfile.k_kg_ha / profile.fertilizerProfile.splitApplications);

  const stages = [
    {
      id: "stage-prep",
      name: "Land Preparation",
      type: "preparation",
      startDay: -14,
      endDay: 0,
      description: `Prepare soil 2 weeks before planting. Incorporate organic matter. Climate: mean ${climate.annualMeanTemp}°C, annual rainfall ${climate.annualTotalRainfall}mm.`,
      tasks: [
        "Deep plow to 20-25cm depth",
        "Soil pH test (target 6.0-7.0 for most crops)",
        "Apply basal compost (5-10 tons/ha)",
        `Apply basal ${fertPTotal}kg/ha P₂O₅ and ${fertKPerApp}kg/ha K₂O`,
        "Ensure adequate drainage channels",
        "Level field for uniform water distribution",
      ],
      weatherConsiderations: "Avoid tillage in wet conditions. Soil should be moist but not waterlogged.",
      inputsNeeded: ["Plow/tractor", "Compost", `Phosphate fertilizer (${fertPTotal}kg/ha)`, `Potash (${fertKPerApp}kg/ha)`, "pH meter"],
      priority: "critical",
    },
    {
      id: "stage-plant",
      name: "Planting / Sowing",
      type: "planting",
      startDay: 0,
      endDay: days.germination,
      description: `Plant ${profile.name} at optimal spacing. GDD base: ${profile.gddBase}°C. Expected GDD to germination: ${profile.gddPhases.germination} GDD at local rate of ${avgGDD.toFixed(1)} GDD/day.`,
      tasks: [
        `Plant at recommended spacing for ${profile.name}`,
        "Use certified, disease-free seed or planting material",
        "Seed treatment with fungicide if available",
        "Mark rows clearly for mechanized operations",
        "Record planting date and field map",
      ],
      weatherConsiderations: `Optimal planting temperature: ${profile.tempRange.min}–${profile.tempRange.max}°C. Avoid planting before heavy rain.`,
      inputsNeeded: ["Certified seeds", "Seed treatment fungicide", "Planting tools", "Measuring tape"],
      priority: "critical",
    },
    {
      id: "stage-germination",
      name: "Germination & Emergence",
      type: "germination",
      startDay: days.germination,
      endDay: days.establishment,
      description: `Seedling emergence and establishment. Accumulate ${profile.gddPhases.establishment} GDD for full establishment (${days.establishment} days at local rate).`,
      tasks: [
        "Monitor germination rate (target >85%)",
        "Gap-fill missing stands within first week",
        "Apply pre-emergence herbicide if needed",
        "Begin light irrigation to maintain soil moisture",
      ],
      weatherConsiderations: "Protect from heavy rain and standing water. Maintain consistent soil moisture.",
      inputsNeeded: ["Irrigation water", "Pre-emergence herbicide (optional)", "Replacement seeds"],
      priority: "high",
    },
    {
      id: "stage-vegetative",
      name: "Vegetative Growth",
      type: "growth",
      startDay: days.establishment,
      endDay: days.vegetative,
      description: `Rapid leaf and stem development. Apply first split of N fertilizer at ${days.establishment} DAP. Critical period: ${days.establishment}–${days.vegetative} days.`,
      tasks: [
        `Apply ${fertNPerApp}kg/ha N (split 1 of ${profile.fertilizerProfile.splitApplications})`,
        "Monitor for early pest and disease symptoms",
        "Weed control — critical window for yield protection",
        `Maintain irrigation for ${profile.waterRequirementMm}mm seasonal requirement`,
        "Scout for ${profile.commonPests[0]?.name ?? 'pests'} weekly",
      ],
      weatherConsiderations: `Watch for heat stress (>${profile.tempRange.max}°C) or cold stress (<${profile.tempRange.min}°C).`,
      inputsNeeded: [`N fertilizer (${fertNPerApp}kg/ha)`, "Herbicide", "Irrigation equipment"],
      priority: "high",
    },
    {
      id: "stage-flowering",
      name: "Flowering & Pollination",
      type: "fertilization",
      startDay: days.vegetative,
      endDay: days.flowering,
      description: `Critical stage for yield determination. Apply second N split at ${days.vegetative} DAP. Protect from water stress and temperature extremes.`,
      tasks: [
        `Apply ${fertNPerApp}kg/ha N (split 2 of ${profile.fertilizerProfile.splitApplications})`,
        `Apply ${fertKPerApp}kg/ha K₂O to improve flower/fruit quality`,
        "Ensure adequate moisture — critical water stage",
        "Monitor for fungal diseases in humid conditions",
        "Avoid pesticide application during active pollination hours (6-10 AM)",
      ],
      weatherConsiderations: `Avoid heat (>${profile.tempRange.max}°C) and water stress during flowering. Both reduce fruit/grain set.`,
      inputsNeeded: [`N fertilizer (${fertNPerApp}kg/ha)`, `Potash (${fertKPerApp}kg/ha)`, "Fungicide (if needed)"],
      priority: "critical",
    },
    {
      id: "stage-grain-set",
      name: "Fruit / Grain Development",
      type: "monitoring",
      startDay: days.flowering,
      endDay: days.fruitSet,
      description: `Fruit or grain filling phase. Maintain irrigation and nutrition. Apply potassium to improve quality and storage.`,
      tasks: [
        `Apply ${fertKPerApp}kg/ha K₂O for quality improvement`,
        "Monitor and control insect pests that damage fruit/grain",
        "Maintain adequate moisture during grain/fruit fill",
        "Monitor for disease progression and treat if threshold exceeded",
      ],
      weatherConsiderations: "Protect from hailstorms. Excess rain may cause fungal issues. Drought at this stage reduces grain weight.",
      inputsNeeded: [`Potash (${fertKPerApp}kg/ha)`, "Insecticide (if threshold exceeded)", "Irrigation water"],
      priority: "high",
    },
    {
      id: "stage-maturity",
      name: "Maturity & Pre-Harvest",
      type: "monitoring",
      startDay: days.fruitSet,
      endDay: days.maturity,
      description: `Crop reaches physiological maturity. Reduce irrigation 2 weeks before harvest. Prepare harvest equipment.`,
      tasks: [
        "Assess crop maturity indicators (color, dry matter, moisture)",
        "Reduce irrigation 10-14 days before harvest",
        "Arrange harvest labor and equipment",
        "Prepare storage facility (clean, ventilated, pest-free)",
        "Monitor for late-season disease and insect pressure",
      ],
      weatherConsiderations: "Dry weather preferred for harvest. Rain at maturity can cause quality loss and sprouting.",
      inputsNeeded: ["Moisture meter", "Harvest equipment", "Storage bags", "Drying facility"],
      priority: "high",
    },
    {
      id: "stage-harvest",
      name: "Harvest & Post-Harvest",
      type: "harvest",
      startDay: days.maturity,
      endDay: days.maturity + harvestWindow,
      description: `Harvest window: ${harvestWindow} days. Expected yield: ${expectedYield}. Proper post-harvest handling critical for quality and marketability.`,
      tasks: [
        `Harvest at optimal maturity for ${profile.name}`,
        "Handle carefully to minimize physical damage",
        "Sort and grade by size/quality",
        "Dry to safe storage moisture content",
        "Apply post-harvest treatment if required (fumigation, waxing)",
        "Record actual yield for farm records",
      ],
      weatherConsiderations: "Harvest on clear days when possible. Avoid harvest after heavy rain.",
      inputsNeeded: ["Harvest tools/machinery", "Storage containers", "Weighing scale", "Post-harvest treatments"],
      priority: "critical",
    },
  ];

  const milestones = [
    { day: 0, label: "Planting Day", description: "Crop planted in field", icon: "seedling" },
    { day: days.germination, label: "Germination", description: `Seedlings emerge — ${profile.gddPhases.germination} GDD accumulated`, icon: "seedling" },
    { day: days.establishment, label: "Established", description: "Full crop stand established", icon: "seedling" },
    { day: days.establishment, label: "1st Fertilizer", description: `Apply ${fertNPerApp}kg/ha N`, icon: "fertilizer" },
    { day: days.vegetative, label: "Vegetative Peak", description: "Maximum leaf area — 2nd fertilizer application", icon: "fertilizer" },
    { day: days.flowering, label: "Flowering", description: "Critical reproductive stage", icon: "water" },
    { day: days.fruitSet, label: "Grain/Fruit Set", description: "Fruit or grain development begins", icon: "harvest" },
    { day: days.maturity, label: "Maturity / Harvest", description: `Expected yield: ${expectedYield}`, icon: "harvest" },
  ];

  const irrigScheduleDays = profile.criticalWaterStages.length;
  const irrigationSchedule = profile.criticalWaterStages.map((stage, i) => {
    const stageDay = [days.establishment, days.vegetative, days.flowering, days.fruitSet][i] ?? days.establishment + i * 20;
    // Approximate tmax/tmin from annual mean (± 5°C diurnal range estimate)
    const et0 = computeET0(climate.lat ?? 14.6, climate.annualMeanTemp + 5, climate.annualMeanTemp - 5, doy);
    const kc = getCropCoefficient(["establishment", "vegetative", "flowering", "fruitOrGrainSet"][i] ?? "vegetative");
    const etCrop = et0 * kc;
    return {
      day: stageDay,
      stage,
      etCrop: Math.round(etCrop * 10) / 10,
      waterDepth: Math.round(etCrop * 7 * 10) / 10,
      frequency: etCrop > 5 ? "Daily" : etCrop > 3 ? "Every 2 days" : "Every 3 days",
      method: profile.waterRequirementMm > 800 ? "Flood / furrow irrigation" : "Drip or furrow",
      notes: `Critical for ${stage}. ET₀ × Kc = ${etCrop.toFixed(1)} mm/day (Hargreaves-Samani method).`,
    };
  });

  const fertilizerSchedule = Array.from({ length: profile.fertilizerProfile.splitApplications }, (_, i) => {
    const appDay = [0, days.establishment, days.vegetative, days.flowering][i] ?? days.establishment + i * 20;
    const nPerApp = Math.round(profile.fertilizerProfile.n_kg_ha / profile.fertilizerProfile.splitApplications);
    return {
      day: appDay,
      product: i === 0 ? `Complete fertilizer (NPK) — Basal` : i === profile.fertilizerProfile.splitApplications - 1 ? `KCl / Muriate of Potash (K-dominant)` : `Urea or Ammonium Sulfate (N)`,
      rate: i === 0
        ? `${fertPTotal}kg/ha P₂O₅ + ${fertKPerApp}kg/ha K₂O + ${nPerApp}kg/ha N`
        : i === profile.fertilizerProfile.splitApplications - 1
          ? `${nPerApp}kg/ha N + ${fertKPerApp}kg/ha K₂O`
          : `${nPerApp}kg/ha N`,
      method: i === 0 ? "Incorporate into soil at planting" : "Side-dress near root zone or broadcast",
      purpose: i === 0 ? "Basal — root development and early growth" : i === profile.fertilizerProfile.splitApplications - 1 ? "Final — quality improvement and maturity support" : `Split ${i + 1} — vegetative growth and tillering`,
    };
  });

  const pestAlerts = profile.commonPests.map((pest) => ({
    name: pest.name,
    riskPeriod: `When temp ${pest.tempTriggerMin}–${pest.tempTriggerMax}°C${pest.humidityTrigger ? ` + humidity >${pest.humidityTrigger}%` : ""}`,
    symptoms: `Monitor fields when temperature is ${pest.tempTriggerMin}–${pest.tempTriggerMax}°C`,
    treatment: "Scout weekly. Apply registered pesticide at economic threshold. Use IPM — biocontrol first.",
    riskActive: forecast.some(
      (d) =>
        d.tempMax >= pest.tempTriggerMin && d.tempMax <= pest.tempTriggerMax + 5 &&
        (pest.humidityTrigger ? true : true)
    ),
  }));

  const weatherAdjustments = [
    {
      trigger: `Temperature > ${profile.tempRange.max}°C`,
      impact: "Flower drop, reduced fruit set, heat stress",
      affectedStages: ["flowering", "fruit-set"],
      action: "Irrigate in early morning to cool soil. Apply shade netting if available. Foliar feed with potassium.",
    },
    {
      trigger: `Temperature < ${profile.tempRange.min}°C`,
      impact: "Slowed growth, chilling injury, frost damage",
      affectedStages: ["germination", "establishment"],
      action: "Cover seedlings with row covers or mulch. Delay planting until temperatures recover.",
    },
    {
      trigger: "Heavy rainfall > 50mm/day",
      impact: "Waterlogging, root rot, nutrient leaching",
      affectedStages: ["establishment", "vegetative"],
      action: "Open drainage channels. Delay fertilizer application by 3–5 days after heavy rain.",
    },
    {
      trigger: "Drought (no rain > 14 days)",
      impact: "Water stress, yield reduction",
      affectedStages: ["flowering", "grain-fill"],
      action: "Prioritize irrigation at critical water stages. Mulch to reduce evaporation.",
    },
  ];

  return {
    crop: profile.name,
    location,
    plantingDate,
    totalGrowingDays,
    estimatedHarvestStart: days.maturity,
    estimatedHarvestEnd: days.maturity + harvestWindow,
    weatherRiskLevel: riskAssessment.level,
    weatherRiskNotes: riskAssessment.notes,
    varietyRecommendation: varietyNote,
    expectedYield,
    cropInfo: wikiInfo ?? `${profile.name} is a ${profile.category.toLowerCase()} crop grown in the Philippines. Optimal temperature: ${profile.tempRange.min}–${profile.tempRange.max}°C.`,
    dataSourcesUsed: [
      "Open-Meteo Historical Climate API (ERA5 reanalysis)",
      "Open-Meteo Forecast API (16-day)",
      "FAO Irrigation Paper No. 56 (GDD constants)",
      "USDA Agronomy Handbooks (open access)",
      "DA Philippines Crop Production Guides",
    ],
    climateAdaptedNote: `Plan computed for ${location}: mean ${climate.annualMeanTemp}°C, ${climate.annualTotalRainfall}mm rainfall/year. Avg GDD rate: ${avgGDD.toFixed(1)}/day (base ${profile.gddBase}°C).`,
    stages,
    milestones,
    weatherAdjustments,
    fertilizerSchedule,
    pestAlerts,
    irrigationSchedule,
  };
}

export function listAvailableCrops(): Array<{ name: string; category: string; emoji: string }> {
  return Object.values(CROP_GDD_PROFILES).map((p) => ({
    name: p.name,
    category: p.category,
    emoji: p.emoji,
  }));
}
