import { createTrip, getTripsForUser, tryConsumeGenerationQuota } from "@/db/trips";
import { requireUserId, UnauthorizedError } from "@/lib/auth-server";
import { inngest } from "@/inngest/client";
import { Sentry } from "@/lib/sentry";
import { generateTripRequestSchema } from "@/lib/trip-schema";

export async function GET(request: Request) {
  return Sentry.startSpan({ op: "http.server", name: "GET /api/trips" }, async () => {
    let userId: string;
    try {
      userId = await requireUserId(request);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return Response.json({ error: err.message }, { status: 401 });
      }
      throw err;
    }

    const trips = await getTripsForUser(userId);
    return Response.json(trips);
  });
}

export async function POST(request: Request) {
  return Sentry.startSpan({ op: "http.server", name: "POST /api/trips" }, async () => {
    let userId: string;
    try {
      userId = await requireUserId(request);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return Response.json({ error: err.message }, { status: 401 });
      }
      throw err;
    }

    const body = await request.json().catch(() => null);
    const parsed = generateTripRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const allowed = await tryConsumeGenerationQuota(userId);
    if (!allowed) {
      Sentry.logger.warn("Daily generation quota reached", { user_id: userId });
      return Response.json(
        { error: "Daily generation limit reached. Try again tomorrow." },
        { status: 429 },
      );
    }

    const trip = await createTrip({ userId, ...parsed.data });

    await inngest.send({
      name: "trip/generate.requested",
      data: { tripId: trip.id },
    });

    Sentry.logger.info("Trip generation requested", {
      trip_id: trip.id,
      user_id: userId,
      destination: parsed.data.destination,
      num_days: parsed.data.numDays,
      num_travelers: parsed.data.numTravelers,
      budget_tier: parsed.data.budgetTier,
    });

    return Response.json({ id: trip.id, status: trip.status }, { status: 201 });
  });
}
