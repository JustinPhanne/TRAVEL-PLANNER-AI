import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  BUDGET_TIERS,
  TRAVEL_PACES,
  TRIP_STATUSES,
  type BudgetBreakdown,
  type Itinerary,
} from "@/lib/trip-schema";

export const usersTable = pgTable("users", {
  clerkId: text("clerk_id").primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export const tripStatusEnum = pgEnum("trip_status", TRIP_STATUSES);
export const budgetTierEnum = pgEnum("budget_tier", BUDGET_TIERS);
export const travelPaceEnum = pgEnum("travel_pace", TRAVEL_PACES);

export const tripsTable = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.clerkId, { onDelete: "cascade" }),
  destination: text("destination").notNull(),
  startDate: date("start_date").notNull(),
  numDays: integer("num_days").notNull(),
  numTravelers: integer("num_travelers").notNull(),
  budgetTier: budgetTierEnum("budget_tier").notNull(),
  travelPace: travelPaceEnum("travel_pace").notNull(),
  interests: text("interests").array().notNull(),
  status: tripStatusEnum("status").notNull().default("pending"),
  coverImageUrl: text("cover_image_url"),
  coverImageAttributionName: text("cover_image_attribution_name"),
  coverImageAttributionUrl: text("cover_image_attribution_url"),
  itinerary: jsonb("itinerary").$type<Itinerary>(),
  budgetBreakdown: jsonb("budget_breakdown").$type<BudgetBreakdown>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type InsertTrip = typeof tripsTable.$inferInsert;
export type SelectTrip = typeof tripsTable.$inferSelect;

export const assistantMessageRoleEnum = pgEnum("assistant_message_role", [
  "user",
  "assistant",
]);

export const assistantMessagesTable = pgTable(
  "assistant_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.clerkId, { onDelete: "cascade" }),
    role: assistantMessageRoleEnum("role").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("assistant_messages_user_id_created_at_idx").on(table.userId, table.createdAt)],
);

export type InsertAssistantMessage = typeof assistantMessagesTable.$inferInsert;
export type SelectAssistantMessage = typeof assistantMessagesTable.$inferSelect;

export const generationUsageTable = pgTable(
  "generation_usage",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.clerkId, { onDelete: "cascade" }),
    date: date("date").notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.userId, table.date] })],
);
