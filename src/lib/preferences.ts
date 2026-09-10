import * as SecureStore from "expo-secure-store";

import type { BudgetTier, TravelPace } from "@/lib/trip-schema";

export type TravelPreferences = {
  budgetTier: BudgetTier;
  travelPace: TravelPace;
  interests: string[];
};

export type NotificationSettings = {
  pushEnabled: boolean;
  tripReminders: boolean;
  priceAlerts: boolean;
  productUpdates: boolean;
};

export type AppearanceMode = "system" | "light" | "dark";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  tripReminders: true,
  priceAlerts: false,
  productUpdates: false,
};

export const DEFAULT_TRAVEL_PREFERENCES: TravelPreferences = {
  budgetTier: "comfort",
  travelPace: "relaxed",
  interests: [],
};

const KEYS = {
  travelPreferences: "triply.travelPreferences",
  notificationSettings: "triply.notificationSettings",
  appearance: "triply.appearance",
  language: "triply.language",
} as const;

async function readJSON<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  return SecureStore.setItemAsync(key, JSON.stringify(value));
}

export async function getTravelPreferences(): Promise<TravelPreferences> {
  return (await readJSON<TravelPreferences>(KEYS.travelPreferences)) ?? DEFAULT_TRAVEL_PREFERENCES;
}

export function saveTravelPreferences(value: TravelPreferences) {
  return writeJSON(KEYS.travelPreferences, value);
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return (
    (await readJSON<NotificationSettings>(KEYS.notificationSettings)) ??
    DEFAULT_NOTIFICATION_SETTINGS
  );
}

export function saveNotificationSettings(value: NotificationSettings) {
  return writeJSON(KEYS.notificationSettings, value);
}

export async function getAppearanceMode(): Promise<AppearanceMode> {
  const value = await SecureStore.getItemAsync(KEYS.appearance);
  return value === "light" || value === "dark" ? value : "system";
}

export function saveAppearanceMode(value: AppearanceMode) {
  return SecureStore.setItemAsync(KEYS.appearance, value);
}

export async function getLanguageCode(): Promise<string> {
  return (await SecureStore.getItemAsync(KEYS.language)) ?? "en";
}

export function saveLanguageCode(value: string) {
  return SecureStore.setItemAsync(KEYS.language, value);
}

export async function clearAllPreferences() {
  await Promise.all(Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key)));
}
