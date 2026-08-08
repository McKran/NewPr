import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const farmingPlans = pgTable("farming_plans", {
  id: serial("id").primaryKey(),
  crop: text("crop").notNull(),
  location: text("location").notNull(),
  plantingDate: text("planting_date").notNull(),
  planData: jsonb("plan_data").notNull(),
  climateProfile: jsonb("climate_profile"),
  dataSourcesUsed: jsonb("data_sources_used"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type FarmingPlan = typeof farmingPlans.$inferSelect;
