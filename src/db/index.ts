import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("Add DATABASE_URL to your .env file");
}

export const db = drizzle(process.env.DATABASE_URL, { schema });
