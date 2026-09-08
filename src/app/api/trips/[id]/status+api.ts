import { getTripForUser } from "@/db/trips";
import { requireUserId, UnauthorizedError } from "@/lib/auth-server";

export async function GET(request: Request, { id }: Record<string, string>) {
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
}
