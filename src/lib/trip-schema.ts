import { z } from "zod";

export const BUDGET_TIERS = ["budget", "comfort", "luxury"] as const;
export type BudgetTier = (typeof BUDGET_TIERS)[number];

export const TRAVEL_PACES = ["relaxed", "balanced", "fast-paced"] as const;
export type TravelPace = (typeof TRAVEL_PACES)[number];

export const TRIP_STATUSES = ["pending", "generating", "ready", "failed"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const PLACE_CATEGORIES = ["attraction", "restaurant", "activity"] as const;

export const tripPlaceSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(PLACE_CATEGORIES),
  lat: z.number(),
  lng: z.number(),
});

export const tripDaySchema = z.object({
  day: z.number().int().min(1),
  title: z.string(),
  summary: z.string(),
  places: z.array(tripPlaceSchema),
});

export const tripHotelSchema = z.object({
  name: z.string(),
  description: z.string(),
  priceRange: z.string(),
  lat: z.number(),
  lng: z.number(),
});

export const itinerarySchema = z.object({
  days: z.array(tripDaySchema),
  hotels: z.array(tripHotelSchema),
});

export const budgetCategorySchema = z.object({
  label: z.string(),
  amountPerPerson: z.number(),
});

export const budgetBreakdownSchema = z.object({
  currency: z.string(),
  totalPerPerson: z.number(),
  totalForGroup: z.number(),
  categories: z.array(budgetCategorySchema),
});

export const tripGenerationResultSchema = z.object({
  itinerary: itinerarySchema,
  budgetBreakdown: budgetBreakdownSchema,
});

export type Itinerary = z.infer<typeof itinerarySchema>;
export type BudgetBreakdown = z.infer<typeof budgetBreakdownSchema>;
export type TripGenerationResult = z.infer<typeof tripGenerationResultSchema>;

// Hand-written to mirror `tripGenerationResultSchema` exactly — Gemini's
// structured-output config (`responseJsonSchema`) takes plain JSON Schema,
// not a zod schema instance.
export const TRIP_GENERATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    itinerary: {
      type: "object",
      additionalProperties: false,
      properties: {
        days: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              day: { type: "integer" },
              title: { type: "string" },
              summary: { type: "string" },
              places: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string", enum: PLACE_CATEGORIES },
                    lat: { type: "number" },
                    lng: { type: "number" },
                  },
                  required: ["name", "description", "category", "lat", "lng"],
                },
              },
            },
            required: ["day", "title", "summary", "places"],
          },
        },
        hotels: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              priceRange: { type: "string" },
              lat: { type: "number" },
              lng: { type: "number" },
            },
            required: ["name", "description", "priceRange", "lat", "lng"],
          },
        },
      },
      required: ["days", "hotels"],
    },
    budgetBreakdown: {
      type: "object",
      additionalProperties: false,
      properties: {
        currency: { type: "string" },
        totalPerPerson: { type: "number" },
        totalForGroup: { type: "number" },
        categories: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              label: { type: "string" },
              amountPerPerson: { type: "number" },
            },
            required: ["label", "amountPerPerson"],
          },
        },
      },
      required: ["currency", "totalPerPerson", "totalForGroup", "categories"],
    },
  },
  required: ["itinerary", "budgetBreakdown"],
} as const;

export const generateTripRequestSchema = z.object({
  destination: z.string().trim().min(1).max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),
  numDays: z.number().int().min(1).max(30),
  numTravelers: z.number().int().min(1).max(20),
  budgetTier: z.enum(BUDGET_TIERS),
  travelPace: z.enum(TRAVEL_PACES),
  interests: z.array(z.string().trim().min(1)).max(20),
});

export type GenerateTripRequest = z.infer<typeof generateTripRequestSchema>;
