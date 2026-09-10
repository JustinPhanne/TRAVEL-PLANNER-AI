import { deleteMessagesForUser, getMessagesForUser } from "@/db/assistant-messages";
import { requireUserId, UnauthorizedError } from "@/lib/auth-server";
import { Sentry } from "@/lib/sentry";

export async function GET(request: Request) {
  return Sentry.startSpan(
    { op: "http.server", name: "GET /api/assistant/messages" },
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

      const messages = await getMessagesForUser(userId);
      return Response.json({
        messages: messages.map((m) => ({ id: m.id, role: m.role, text: m.text })),
      });
    },
  );
}

export async function DELETE(request: Request) {
  return Sentry.startSpan(
    { op: "http.server", name: "DELETE /api/assistant/messages" },
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

      await deleteMessagesForUser(userId);
      Sentry.logger.info("Assistant conversation cleared", { user_id: userId });

      return new Response(null, { status: 204 });
    },
  );
}
