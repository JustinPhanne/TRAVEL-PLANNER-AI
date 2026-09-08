import type { UserDeletedJSON, UserJSON } from "@clerk/backend";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { usersTable, type SelectTrip } from "@/db/schema";
import { getTripById, setTripFailed, setTripGenerating, setTripReady } from "@/db/trips";
import { GEMINI_MODEL, gemini } from "@/lib/gemini";
import { uploadCoverImageFromUrl } from "@/lib/imagekit";
import {
  TRIP_GENERATION_JSON_SCHEMA,
  tripGenerationResultSchema,
} from "@/lib/trip-schema";
import { findDestinationCoverImage } from "@/lib/unsplash";

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

function buildTripPrompt(
  trip: Pick<
    SelectTrip,
    "destination" | "startDate" | "numDays" | "numTravelers" | "budgetTier" | "travelPace" | "interests"
  >,
): string {
  return [
    `Plan a ${trip.numDays}-day trip to ${trip.destination} starting ${trip.startDate}.`,
    `Travelers: ${trip.numTravelers}.`,
    `Budget tier: ${trip.budgetTier}.`,
    `Preferred pace: ${trip.travelPace}.`,
    trip.interests.length > 0 ? `Interests: ${trip.interests.join(", ")}.` : null,
    "",
    "For each day, suggest a title, a short summary, and 3-5 real, specific places",
    "(attractions, restaurants, or activities) with a one-sentence description and",
    "approximate latitude/longitude. Also suggest 2-3 hotels matching the budget tier",
    "with approximate latitude/longitude. Then estimate a per-person and total-for-group",
    "budget breakdown by category (e.g. lodging, food, activities, transport) in USD",
    "consistent with the budget tier and destination.",
  ]
    .filter(Boolean)
    .join("\n");
}

export const generateTrip = inngest.createFunction(
  {
    id: "generate-trip",
    triggers: [{ event: "trip/generate.requested" }],
    retries: 3,
    onFailure: async ({ event, error }) => {
      const { tripId } = event.data.event.data as { tripId: string };
      await setTripFailed(tripId, error.message || "Trip generation failed");
    },
  },
  async ({ event, step }) => {
    const { tripId } = event.data as { tripId: string };

    const trip = await step.run("load-trip", async () => {
      const row = await getTripById(tripId);
      if (!row) throw new Error(`Trip ${tripId} not found`);
      return row;
    });

    await step.run("set-generating", () => setTripGenerating(tripId));

    const result = await step.run("generate-itinerary", async () => {
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          "You are a meticulous travel planner. Respond only with the requested JSON — no prose.",
          "",
          buildTripPrompt(trip),
        ].join("\n"),
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: TRIP_GENERATION_JSON_SCHEMA,
        },
      });

      const content = response.text;
      if (!content) {
        const blockReason = response.promptFeedback?.blockReason;
        throw new Error(
          blockReason ? `Gemini blocked the request: ${blockReason}` : "Gemini returned no content",
        );
      }

      const parsed = tripGenerationResultSchema.safeParse(JSON.parse(content));
      if (!parsed.success) {
        throw new Error(`Gemini output failed schema validation: ${parsed.error.message}`);
      }
      return parsed.data;
    });

    const coverImage = await step.run("cover-image", async () => {
      try {
        const found = await findDestinationCoverImage(trip.destination);
        if (!found) return null;

        const safeName = trip.destination.replace(/[^a-zA-Z0-9-]+/g, "-");
        const uploadedUrl = await uploadCoverImageFromUrl(found.url, `${safeName}-${tripId}.jpg`);
        return {
          url: uploadedUrl,
          photographerName: found.photographerName,
          photographerProfileUrl: found.photographerProfileUrl,
        };
      } catch (err) {
        // Cover image is best-effort — a trip is still usable without one.
        console.error("Cover image fetch/upload failed:", err);
        return null;
      }
    });

    await step.run("persist-result", () =>
      setTripReady(tripId, {
        itinerary: result.itinerary,
        budgetBreakdown: result.budgetBreakdown,
        coverImageUrl: coverImage?.url ?? null,
        coverImageAttributionName: coverImage?.photographerName ?? null,
        coverImageAttributionUrl: coverImage?.photographerProfileUrl ?? null,
      }),
    );
  },
);
