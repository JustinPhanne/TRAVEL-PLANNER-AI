import type { BudgetTier, TravelPace } from "@/lib/trip-schema";

export const BUDGET_TIERS = ["Budget", "Comfort", "Luxury"] as const;
export const TRAVEL_PACES = ["Relaxed", "Balanced", "Fast-paced"] as const;

export const BUDGET_TIER_VALUES: Record<(typeof BUDGET_TIERS)[number], BudgetTier> = {
  Budget: "budget",
  Comfort: "comfort",
  Luxury: "luxury",
};

export const TRAVEL_PACE_VALUES: Record<(typeof TRAVEL_PACES)[number], TravelPace> = {
  Relaxed: "relaxed",
  Balanced: "balanced",
  "Fast-paced": "fast-paced",
};

export const BUDGET_TIER_LABELS: Record<BudgetTier, (typeof BUDGET_TIERS)[number]> = {
  budget: "Budget",
  comfort: "Comfort",
  luxury: "Luxury",
};

export const TRAVEL_PACE_LABELS: Record<TravelPace, (typeof TRAVEL_PACES)[number]> = {
  relaxed: "Relaxed",
  balanced: "Balanced",
  "fast-paced": "Fast-paced",
};

export const INTERESTS = [
  "Adventure",
  "Beaches",
  "Food & drink",
  "Culture",
  "Nature",
  "Nightlife",
  "Shopping",
  "History",
  "Relaxation",
  "Road trips",
];
