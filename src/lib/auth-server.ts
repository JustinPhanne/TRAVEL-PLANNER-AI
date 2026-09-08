import { verifyToken } from "@clerk/backend";

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

  if (!token) {
    throw new UnauthorizedError("Missing bearer token");
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    return payload.sub;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
