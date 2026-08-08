import { db } from "@workspace/db";
import { cache } from "@workspace/db";
import { eq, lt } from "drizzle-orm";

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const rows = await db
      .select()
      .from(cache)
      .where(eq(cache.key, key))
      .limit(1);

    if (!rows.length) return null;
    const row = rows[0];
    if (new Date(row.expiresAt) < new Date()) {
      await db.delete(cache).where(eq(cache.key, key));
      return null;
    }
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, value: T, ttlMs: number): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlMs);
    const serialized = JSON.stringify(value);
    await db
      .insert(cache)
      .values({ key, value: serialized, expiresAt })
      .onConflictDoUpdate({
        target: cache.key,
        set: { value: serialized, expiresAt, createdAt: new Date() },
      });
  } catch {
    // Non-fatal: silently skip caching on error
  }
}

export async function evictExpired(): Promise<void> {
  try {
    await db.delete(cache).where(lt(cache.expiresAt, new Date()));
  } catch {}
}

export const TTL = {
  WEATHER: 30 * 60 * 1000,        // 30 minutes
  DASHBOARD: 6 * 60 * 60 * 1000,  // 6 hours
  MARKET_PRICES: 60 * 60 * 1000,  // 1 hour
  MARKET_INSIGHT: 30 * 60 * 1000, // 30 minutes
  FARMING_PLAN: 24 * 60 * 60 * 1000, // 24 hours
};
