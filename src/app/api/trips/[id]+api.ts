import { deleteTripForUser, getTripForUser } from "@/db/trips";
import { requireUserId, UnauthorizedError } from "@/lib/auth-server";
import { Sentry } from "@/lib/sentry";

export async function GET(request: Request, { id }: Record<string, string>) {
  return Sentry.startSpan({ op: "http.server", name: "GET /api/trips/[id]" }, async () => {
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

    return Response.json(trip);
  });
}

export async function DELETE(request: Request, { id }: Record<string, string>) {
  return Sentry.startSpan({ op: "http.server", name: "DELETE /api/trips/[id]" }, async () => {
    let userId: string;
    try {
      userId = await requireUserId(request);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return Response.json({ error: err.message }, { status: 401 });
      }
      throw err;
    }

    const deleted = await deleteTripForUser(id, userId);
    if (!deleted) {
      return Response.json({ error: "Trip not found" }, { status: 404 });
    }

    Sentry.logger.info("Trip deleted", { trip_id: id, user_id: userId });

    return new Response(null, { status: 204 });
  });
}
