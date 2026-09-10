import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { generationUsageTable, tripsTable, type SelectTrip } from "@/db/schema";
import type {
  BudgetBreakdown,
  BudgetTier,
  Itinerary,
  TravelPace,
} from "@/lib/trip-schema";

const DAILY_GENERATION_CAP = 20;

/**
 * Atomically increments today's generation counter for a user unless they've
 * already hit the daily cap. Returns whether the generation is allowed.
 */
export async function tryConsumeGenerationQuota(userId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);

  const rows = await db
    .insert(generationUsageTable)
    .values({ userId, date: today, count: 1 })
    .onConflictDoUpdate({
      target: [generationUsageTable.userId, generationUsageTable.date],
      set: { count: sql`${generationUsageTable.count} + 1` },
      setWhere: sql`${generationUsageTable.count} < ${DAILY_GENERATION_CAP}`,
    })
    .returning({ count: generationUsageTable.count });

  return rows.length > 0;
}

export async function createTrip(input: {
  userId: string;
  destination: string;
  startDate: string;
  numDays: number;
  numTravelers: number;
  budgetTier: BudgetTier;
  travelPace: TravelPace;
  interests: string[];
}): Promise<SelectTrip> {
  const [trip] = await db.insert(tripsTable).values(input).returning();
  return trip;
}

export async function getTripsForUser(userId: string): Promise<SelectTrip[]> {
  return db
    .select()
    .from(tripsTable)
    .where(eq(tripsTable.userId, userId))
    .orderBy(desc(tripsTable.createdAt));
}

export async function getTripForUser(
  tripId: string,
  userId: string,
): Promise<SelectTrip | undefined> {
  const [trip] = await db
    .select()
    .from(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(tripsTable.userId, userId)));
  return trip;
}

/** Unscoped lookup for trusted server contexts (e.g. the Inngest worker). */
export async function getTripById(tripId: string): Promise<SelectTrip | undefined> {
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  return trip;
}

export async function setTripGenerating(tripId: string): Promise<void> {
  await db
    .update(tripsTable)
    .set({ status: "generating" })
    .where(eq(tripsTable.id, tripId));
}

export async function setTripReady(
  tripId: string,
  data: {
    itinerary: Itinerary;
    budgetBreakdown: BudgetBreakdown;
    coverImageUrl: string | null;
    coverImageAttributionName: string | null;
    coverImageAttributionUrl: string | null;
  },
): Promise<void> {
  await db
    .update(tripsTable)
    .set({
      status: "ready",
      itinerary: data.itinerary,
      budgetBreakdown: data.budgetBreakdown,
      coverImageAttributionName: data.coverImageAttributionName,
      coverImageAttributionUrl: data.coverImageAttributionUrl,
      coverImageUrl: data.coverImageUrl,
      errorMessage: null,
    })
    .where(eq(tripsTable.id, tripId));
}

export async function setTripFailed(tripId: string, errorMessage: string): Promise<void> {
  await db
    .update(tripsTable)
    .set({ status: "failed", errorMessage })
    .where(eq(tripsTable.id, tripId));
}

export async function resetTripForRetry(tripId: string): Promise<void> {
  await db
    .update(tripsTable)
    .set({ status: "pending", errorMessage: null })
    .where(eq(tripsTable.id, tripId));
}

/** Returns whether a matching trip was actually deleted. */
export async function deleteTripForUser(tripId: string, userId: string): Promise<boolean> {
  const deleted = await db
    .delete(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(tripsTable.userId, userId)))
    .returning({ id: tripsTable.id });
  return deleted.length > 0;
}
