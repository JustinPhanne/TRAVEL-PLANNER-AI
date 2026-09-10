import { clerkClient } from "@/lib/clerk";
import { requireUserId, UnauthorizedError } from "@/lib/auth-server";
import { Sentry } from "@/lib/sentry";

export async function DELETE(request: Request) {
  return Sentry.startSpan({ op: "http.server", name: "DELETE /api/account" }, async () => {
    let userId: string;
    try {
      userId = await requireUserId(request);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return Response.json({ error: err.message }, { status: 401 });
      }
      throw err;
    }

    // Deleting the user in Clerk fires a `user.deleted` webhook, which is
    // handled by the deleteUserFromClerk Inngest function — that removes the
    // user row from the DB, cascading to their trips, assistant messages,
    // and generation usage.
    await clerkClient.users.deleteUser(userId);

    Sentry.logger.info("User account deleted", { user_id: userId });

    return new Response(null, { status: 204 });
  });
}
