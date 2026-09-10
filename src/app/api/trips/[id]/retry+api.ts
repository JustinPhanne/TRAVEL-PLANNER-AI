import { getTripForUser, resetTripForRetry } from "@/db/trips";
import { inngest } from "@/inngest/client";
import { requireUserId, UnauthorizedError } from "@/lib/auth-server";
import { Sentry } from "@/lib/sentry";

// Re-triggers generation for a trip that ended in `failed`. Deliberately does
// NOT touch the daily generation quota — that's only spent on the original
// `POST /api/trips` call.
export async function POST(request: Request, { id }: Record<string, string>) {
  return Sentry.startSpan(
    { op: "http.server", name: "POST /api/trips/[id]/retry" },
    async () => {
      let userId: string;
      try {
        userId = await requireUserId(request);
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          return Response.json({ error: err.message }, { status: 401 });
        }
        throw err;
      }

      const trip = await getTripForUser(id, userId);
      if (!trip) {
        return Response.json({ error: "Trip not found" }, { status: 404 });
      }
      if (trip.status !== "failed") {
        return Response.json({ error: "Trip is not in a failed state" }, { status: 409 });
      }

      await resetTripForRetry(trip.id);
      await inngest.send({
        name: "trip/generate.requested",
        data: { tripId: trip.id },
      });

      Sentry.logger.info("Trip generation retry requested", {
        trip_id: trip.id,
        user_id: userId,
        previous_error: trip.errorMessage,
      });

      return Response.json({ id: trip.id, status: "pending" });
    },
  );
}
