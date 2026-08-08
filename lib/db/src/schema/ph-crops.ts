import { pgTable, serial, text, integer, jsonb, real } from "drizzle-orm/pg-core";

export const phCrops = pgTable("ph_crops", {
  id: serial("id").primaryKey(),
  cropName: text("crop_name").notNull(),
  localName: text("local_name"),
  category: text("category").notNull(),
  subCategory: text("sub_category"),
  emoji: text("emoji").notNull().default("🌱"),
  growthDurationDays: text("growth_duration_days").notNull(),
  growthDurationMin: integer("growth_duration_min"),
  growthDurationMax: integer("growth_duration_max"),
  idealTempMin: real("ideal_temp_min"),
  idealTempMax: real("ideal_temp_max"),
  waterRequirementLevel: text("water_requirement_level").notNull().default("medium"),
  waterRequirementMm: integer("water_requirement_mm"),
  fertilizerStages: jsonb("fertilizer_stages"),
  regionSuitability: jsonb("region_suitability"),
  plantingMonths: jsonb("planting_months"),
  harvestMonths: jsonb("harvest_months"),
  notes: text("notes"),
});

export type PhCrop = typeof phCrops.$inferSelect;
