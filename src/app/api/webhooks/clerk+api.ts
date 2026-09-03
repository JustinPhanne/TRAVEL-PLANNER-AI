import { verifyWebhook } from "@clerk/backend/webhooks";

import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
  let event;
  try {
    event = await verifyWebhook(request, {
      signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    });
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    await inngest.send({
      name: `clerk/${event.type}`,
      data: event.data,
    });
  }

  if (event.type === "user.deleted") {
    await inngest.send({
      name: "clerk/user.deleted",
      data: event.data,
    });
  }

  return new Response("Webhook received", { status: 200 });
}
