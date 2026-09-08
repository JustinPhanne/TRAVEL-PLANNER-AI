import { createTrip, tryConsumeGenerationQuota } from "@/db/trips";
import { requireUserId, UnauthorizedError } from "@/lib/auth-server";
import { inngest } from "@/inngest/client";
import { generateTripRequestSchema } from "@/lib/trip-schema";

export async function POST(request: Request) {
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

  return Response.json({ id: trip.id, status: trip.status }, { status: 201 });
}
