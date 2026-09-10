import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { assistantMessagesTable, type SelectAssistantMessage } from "@/db/schema";

const HISTORY_LIMIT = 50;

export async function getMessagesForUser(userId: string): Promise<SelectAssistantMessage[]> {
  return db
    .select()
    .from(assistantMessagesTable)
    .where(eq(assistantMessagesTable.userId, userId))
    .orderBy(asc(assistantMessagesTable.createdAt))
    .limit(HISTORY_LIMIT);
}

export async function addMessage(input: {
  userId: string;
  role: "user" | "assistant";
  text: string;
}): Promise<SelectAssistantMessage> {
  const [message] = await db.insert(assistantMessagesTable).values(input).returning();
  return message;
}

export async function deleteMessagesForUser(userId: string): Promise<void> {
  await db.delete(assistantMessagesTable).where(eq(assistantMessagesTable.userId, userId));
}
