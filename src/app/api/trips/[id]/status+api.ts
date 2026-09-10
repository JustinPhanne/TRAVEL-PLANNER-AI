import { getTripForUser } from "@/db/trips";
import { requireUserId, UnauthorizedError } from "@/lib/auth-server";
import { Sentry } from "@/lib/sentry";

export async function GET(request: Request, { id }: Record<string, string>) {
  return Sentry.startSpan(
    { op: "http.server", name: "GET /api/trips/[id]/status" },
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

      return Response.json({ status: trip.status, errorMessage: trip.errorMessage });
    },
  );
}
