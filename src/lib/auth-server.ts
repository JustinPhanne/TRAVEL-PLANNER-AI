import { verifyToken } from "@clerk/backend";

import { Sentry } from "@/lib/sentry";

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error("Add CLERK_SECRET_KEY to your .env file");
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireUserId(request: Request): Promise<string> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  const path = new URL(request.url).pathname;

  if (!token) {
    Sentry.logger.warn("Request missing bearer token", { path });
    throw new UnauthorizedError("Missing bearer token");
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return payload.sub;
  } catch (err) {
    Sentry.logger.warn(Sentry.logger.fmt`Token verification failed: ${err}`, { path });
    throw new UnauthorizedError("Invalid or expired token");
  }
}
