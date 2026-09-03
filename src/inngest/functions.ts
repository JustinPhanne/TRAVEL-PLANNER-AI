import type { UserDeletedJSON, UserJSON } from "@clerk/backend";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

import { inngest } from "./client";

async function upsertUserFromClerkEvent(user: UserJSON) {
  const email = user.email_addresses.find(
    (e) => e.id === user.primary_email_address_id,
  )?.email_address;

  if (!email) {
    throw new Error(`Clerk user ${user.id} has no primary email address`);
  }

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || null;

  await db
    .insert(usersTable)
    .values({
      clerkId: user.id,
      email,
      name,
      imageUrl: user.image_url ?? null,
    })
    .onConflictDoUpdate({
      target: usersTable.clerkId,
      set: { email, name, imageUrl: user.image_url ?? null },
    });
}

export const syncUserFromClerk = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event, step }) => {
    const user = event.data as UserJSON;
    await step.run("upsert-user", () => upsertUserFromClerkEvent(user));
  },
);

export const updateUserFromClerk = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event, step }) => {
    const user = event.data as UserJSON;
    await step.run("upsert-user", () => upsertUserFromClerkEvent(user));
  },
);

export const deleteUserFromClerk = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event, step }) => {
    const { id: clerkId } = event.data as UserDeletedJSON;

    if (!clerkId) {
      throw new Error("Clerk user.deleted event is missing an id");
    }

    await step.run("delete-user", async () => {
      await db.delete(usersTable).where(eq(usersTable.clerkId, clerkId));
    });
  },
);
