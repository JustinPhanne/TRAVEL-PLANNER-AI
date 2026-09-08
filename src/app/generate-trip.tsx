import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";

import type { BudgetTier, TravelPace } from "@/lib/trip-schema";

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const BLUE = "#3B7CF0";
const BUDGET_TIERS = ["Budget", "Comfort", "Luxury"] as const;
const TRAVEL_PACES = ["Relaxed", "Balanced", "Fast-paced"] as const;

const BUDGET_TIER_VALUES: Record<(typeof BUDGET_TIERS)[number], BudgetTier> = {
  Budget: "budget",
  Comfort: "comfort",
  Luxury: "luxury",
};

const TRAVEL_PACE_VALUES: Record<(typeof TRAVEL_PACES)[number], TravelPace> = {
  Relaxed: "relaxed",
  Balanced: "balanced",
  "Fast-paced": "fast-paced",
};
const INTERESTS = [
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

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatShort(date: Date) {
  return `${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
}

export default function GenerateTripScreen() {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const [destination, setDestination] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [rangeStart, setRangeStart] = useState<Date | null>(() => startOfToday());
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [budget, setBudget] = useState<(typeof BUDGET_TIERS)[number]>("Comfort");
  const [travelers, setTravelers] = useState(2);
  const [interests, setInterests] = useState<string[]>(["Beaches", "Food & drink"]);
  const [pace, setPace] = useState<(typeof TRAVEL_PACES)[number]>("Relaxed");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(visibleMonth);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      0,
    ).getDate();

    const cells: (Date | null)[] = Array(startWeekday).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
    }
    return cells;
  }, [visibleMonth]);

  const handleSelectDay = (day: Date) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(day);
      setRangeEnd(null);
      return;
    }
    if (day.getTime() < rangeStart.getTime()) {
      setRangeStart(day);
      setRangeEnd(null);
      return;
    }
    setRangeEnd(day);
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const dateSummary =
    rangeStart && rangeEnd
      ? `${formatShort(rangeStart)} – ${formatShort(rangeEnd)}`
      : rangeStart
        ? formatShort(rangeStart)
        : null;

  const isFormValid = destination.trim().length > 0 && rangeStart && rangeEnd;

  const handleGenerate = async () => {
    if (!rangeStart || !rangeEnd || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const numDays =
        Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000) + 1;

      const token = await getToken();
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destination: destination.trim(),
          startDate: toISODate(rangeStart),
          numDays,
          numTravelers: travelers,
          budgetTier: BUDGET_TIER_VALUES[budget],
          travelPace: TRAVEL_PACE_VALUES[pace],
          interests,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }

      const { id } = (await res.json()) as { id: string };
      router.replace(`/trip/${id}`);
    } catch (err) {
      Alert.alert(
        "Couldn't start trip generation",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="flex-row items-center px-4 pb-3"
      >
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
        >
          <Ionicons name="chevron-back" size={22} color="#12141F" />
        </Pressable>
        <Text className="flex-1 text-center text-[17px] font-bold text-[#12141F]">
          Plan a trip
        </Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-2 flex-row items-start gap-3 rounded-2xl border border-gray-200 p-4">
          <View
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: BLUE }}
          >
            <Ionicons name="sparkles" size={20} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="text-[16px] font-bold text-[#12141F]">
              Hi! I&apos;m your AI travel assistant.
            </Text>
            <Text className="mt-1 text-[14px] leading-[19px] text-gray-500">
              Tell me a few details and I&apos;ll craft a day-by-day itinerary.
            </Text>
          </View>
        </View>

        <Text className="mb-3 mt-6 text-[18px] font-extrabold text-[#12141F]">
          Where to?
        </Text>
        <View className="flex-row items-center gap-2 rounded-full border border-gray-200 px-4 py-3.5">
          <Ionicons name="location-outline" size={18} color="#9CA3AF" />
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="e.g. Tokyo, Japan"
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-[16px] text-[#12141F]"
          />
        </View>

        <Text className="mb-3 mt-6 text-[18px] font-extrabold text-[#12141F]">
          When?
        </Text>
        <View className="rounded-2xl border border-gray-200 p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={18} color="#9CA3AF" />
            <Text
              className={
                dateSummary
                  ? "text-[15px] font-semibold text-[#12141F]"
                  : "text-[15px] text-gray-400"
              }
            >
              {dateSummary ?? "Select your dates"}
            </Text>
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <Pressable
              onPress={() =>
                setVisibleMonth(
                  (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                )
              }
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
            >
              <Ionicons name="chevron-back" size={18} color="#12141F" />
            </Pressable>
            <Text className="text-[16px] font-extrabold text-[#12141F]">
              {MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </Text>
            <Pressable
              onPress={() =>
                setVisibleMonth(
                  (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                )
              }
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
            >
              <Ionicons name="chevron-forward" size={18} color="#12141F" />
            </Pressable>
          </View>

          <View className="mt-4 flex-row">
            {WEEKDAY_LABELS.map((label, i) => (
              <View key={`${label}-${i}`} className="flex-1 items-center">
                <Text className="text-[12px] font-semibold text-gray-400">
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <View className="mt-1 flex-row flex-wrap">
            {calendarDays.map((day, i) => {
              if (!day) {
                return (
                  <View key={`empty-${i}`} style={{ width: "14.2857%" }} className="py-1" />
                );
              }
              const isStart = isSameDay(day, rangeStart);
              const isEnd = isSameDay(day, rangeEnd);
              const isEdge = isStart || isEnd;
              const inRange =
                rangeStart &&
                rangeEnd &&
                day.getTime() > rangeStart.getTime() &&
                day.getTime() < rangeEnd.getTime();

              return (
                <View key={day.toISOString()} style={{ width: "14.2857%" }} className="items-center py-1">
                  <Pressable
                    onPress={() => handleSelectDay(day)}
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isEdge
                        ? BLUE
                        : inRange
                          ? "#DCE7FC"
                          : "transparent",
                    }}
                  >
                    <Text
                      className="text-[14px]"
                      style={{
                        color: isEdge ? "#ffffff" : inRange ? BLUE : "#374151",
                        fontWeight: isEdge ? "700" : "400",
                      }}
                    >
                      {day.getDate()}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        <Text className="mb-3 mt-6 text-[18px] font-extrabold text-[#12141F]">
          Budget (per person)
        </Text>
        <View className="flex-row gap-2">
          {BUDGET_TIERS.map((tier) => {
            const selected = budget === tier;
            return (
              <Pressable
                key={tier}
                onPress={() => setBudget(tier)}
                className="flex-1 items-center rounded-full border py-3 active:opacity-80"
                style={{
                  backgroundColor: selected ? BLUE : "#ffffff",
                  borderColor: selected ? BLUE : "#E5E7EB",
                }}
              >
                <Text
                  className="text-[15px]"
                  style={{
                    color: selected ? "#ffffff" : "#6B7280",
                    fontWeight: selected ? "700" : "500",
                  }}
                >
                  {tier}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mb-3 mt-6 text-[18px] font-extrabold text-[#12141F]">
          Travelers
        </Text>
        <View className="flex-row items-center justify-between rounded-full border border-gray-200 px-4 py-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="people-outline" size={18} color="#9CA3AF" />
            <Text className="text-[16px] text-[#12141F]">
              {travelers} {travelers === 1 ? "traveler" : "travelers"}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setTravelers((n) => Math.max(1, n - 1))}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
            >
              <Ionicons name="remove" size={18} color="#12141F" />
            </Pressable>
            <Pressable
              onPress={() => setTravelers((n) => Math.min(20, n + 1))}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
            >
              <Ionicons name="add" size={18} color="#12141F" />
            </Pressable>
          </View>
        </View>

        <Text className="mb-3 mt-6 text-[18px] font-extrabold text-[#12141F]">
          Interests
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const selected = interests.includes(interest);
            return (
              <Pressable
                key={interest}
                onPress={() => toggleInterest(interest)}
                className="rounded-full border px-4 py-2.5 active:opacity-80"
                style={{
                  backgroundColor: selected ? BLUE : "#ffffff",
                  borderColor: selected ? BLUE : "#E5E7EB",
                }}
              >
                <Text
                  className="text-[14px]"
                  style={{
                    color: selected ? "#ffffff" : "#6B7280",
                    fontWeight: selected ? "700" : "500",
                  }}
                >
                  {interest}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mb-3 mt-6 text-[18px] font-extrabold text-[#12141F]">
          Travel pace
        </Text>
        <View className="flex-row gap-2">
          {TRAVEL_PACES.map((p) => {
            const selected = pace === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPace(p)}
                className="flex-1 items-center rounded-full border py-3 active:opacity-80"
                style={{
                  backgroundColor: selected ? BLUE : "#ffffff",
                  borderColor: selected ? BLUE : "#E5E7EB",
                }}
              >
                <Text
                  className="text-[15px]"
                  style={{
                    color: selected ? "#ffffff" : "#6B7280",
                    fontWeight: selected ? "700" : "500",
                  }}
                >
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="border-t border-gray-100 px-6 pt-3"
      >
        <Pressable
          disabled={!isFormValid || isSubmitting}
          onPress={handleGenerate}
          className="h-14 flex-row items-center justify-center gap-2 rounded-full active:opacity-90"
          style={{ backgroundColor: isFormValid ? BLUE : "#AFC7F5" }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color="#ffffff" />
              <Text className="text-[16px] font-bold text-white">
                Generate My Trip
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
