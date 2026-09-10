import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";

import type { SelectTrip } from "@/db/schema";
import { Sentry } from "@/lib/sentry";
import type { Itinerary } from "@/lib/trip-schema";

const MAP_PIN_IMAGE = require("../../../design/trip-loading-screen-demo.png");
const AI_LOGO_IMAGE = require("../../../design/ai-logo.png");

const BLUE = "#3B7CF0";
const POLL_INTERVAL_MS = 2500;

const LOADING_STEPS = [
  { key: "discover", label: "Discovering places", icon: "search" as const },
  { key: "organize", label: "Organizing itinerary", icon: "map-outline" as const },
  { key: "finalize", label: "Finalizing recommendations", icon: "sparkles-outline" as const },
];

const LOADING_MESSAGES = [
  ["Scouting the best neighborhoods...", "Finding hidden gems..."],
  ["Mapping out your days...", "Sequencing your itinerary..."],
  ["Double-checking recommendations...", "Adding the finishing touches..."],
];

const MESSAGE_TICK_MS = 2500;
const STEP_TICKS = 3;

function ScreenHeader({ title, topInset }: { title: string; topInset: number }) {
  return (
    <View style={{ paddingTop: topInset + 8 }} className="flex-row items-center px-4 pb-3">
      <Pressable
        onPress={() => router.back()}
        className="h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
      >
        <Ionicons name="chevron-back" size={22} color="#12141F" />
      </Pressable>
      <Text className="flex-1 text-center text-[17px] font-bold text-[#12141F]" numberOfLines={1}>
        {title}
      </Text>
      <View className="h-10 w-10" />
    </View>
  );
}

function shortCityName(destination: string) {
  return destination.split(",")[0]?.trim() || destination;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

function formatCurrency(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${Math.round(amount)}`;
}

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function StatItem({ icon, value, label }: { icon: IoniconName; value: string; label: string }) {
  return (
    <View className="items-center" style={{ width: 104 }}>
      <View
        className="h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: "#EAF1FE" }}
      >
        <Ionicons name={icon} size={26} color={BLUE} />
      </View>
      <Text className="mt-2.5 text-[17px] font-extrabold text-[#12141F]">{value}</Text>
      <Text className="text-center text-[13px] leading-[17px] text-gray-500">{label}</Text>
    </View>
  );
}

function TripMapCard({ itinerary }: { itinerary: Itinerary }) {
  const pins = itinerary.days
    .flatMap((day) => day.places)
    .map((place, i) => ({ ...place, index: i + 1 }));

  if (pins.length === 0) return null;

  const lats = pins.map((p) => p.lat);
  const lngs = pins.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return (
    <View
      style={{ height: 220 }}
      className="mt-3 overflow-hidden rounded-2xl border border-gray-200"
    >
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.02),
          longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.02),
        }}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.index}
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            title={pin.name}
            description={pin.description}
          >
            <View
              className="h-7 w-7 items-center justify-center rounded-full border-2 border-white"
              style={{ backgroundColor: BLUE }}
            >
              <Text className="text-[11px] font-bold text-white">{pin.index}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

function DayCard({
  day,
  expanded,
  onToggle,
}: {
  day: Itinerary["days"][number];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View
      className="rounded-2xl p-4"
      style={{ backgroundColor: expanded ? "#EEF3FF" : "#F7F8FA" }}
    >
      <Pressable onPress={onToggle} className="flex-row items-center justify-between gap-3">
        <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: BLUE }}>
          <Text className="text-[13px] font-bold text-white">{day.day}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-[#12141F]" numberOfLines={1}>
            {day.title}
          </Text>
          {!expanded ? (
            <Text className="mt-0.5 text-[13px] text-gray-500" numberOfLines={1}>
              {day.summary}
            </Text>
          ) : null}
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
      </Pressable>

      {expanded ? (
        <View className="mt-3">
          <Text className="text-[13px] leading-[18px] text-gray-600">{day.summary}</Text>
          <View className="mt-3 gap-2">
            {day.places.map((place, i) => (
              <View key={`${place.name}-${i}`} className="rounded-xl bg-white p-3">
                <Text className="text-[14px] font-bold text-[#12141F]">{place.name}</Text>
                <Text className="mt-0.5 text-[12px] text-gray-500">{place.description}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function TripDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();

  const [trip, setTrip] = useState<SelectTrip | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadingTick, setLoadingTick] = useState(0);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setLoadingTick((t) => t + 1), MESSAGE_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const authedFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const token = await getToken();
      return fetch(path, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [getToken],
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      try {
        const res = await authedFetch(`/api/trips/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Request failed (${res.status})`);
        }
        const data = (await res.json()) as SelectTrip;
        if (cancelled) return;

        setTrip(data);
        setLoadError(null);

        if (data.status !== "pending" && data.status !== "generating" && intervalId) {
          clearInterval(intervalId);
        }
      } catch (err) {
        if (!cancelled) {
          Sentry.logger.error(Sentry.logger.fmt`Trip status poll failed: ${err}`, {
            trip_id: id,
          });
          setLoadError(err instanceof Error ? err.message : "Something went wrong.");
        }
      }
    };

    poll();
    intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, authedFetch, refreshKey]);

  const handleRetry = async () => {
    if (!id || isRetrying) return;
    setIsRetrying(true);
    try {
      const res = await authedFetch(`/api/trips/${id}/retry`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      Sentry.logger.error(Sentry.logger.fmt`Trip retry request failed: ${err}`, { trip_id: id });
      setLoadError(err instanceof Error ? err.message : "Couldn't retry generation.");
    } finally {
      setIsRetrying(false);
    }
  };

  const deleteTrip = async () => {
    if (!id || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await authedFetch(`/api/trips/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      router.replace("/(tabs)");
    } catch (err) {
      Sentry.logger.error(Sentry.logger.fmt`Trip delete request failed: ${err}`, { trip_id: id });
      setIsDeleting(false);
      Alert.alert(
        "Couldn't delete trip",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      "Delete this trip?",
      trip ? `"${trip.destination}" and its itinerary will be permanently deleted.` : undefined,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteTrip },
      ],
    );
  };

  if (loadError && !trip) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Trip" topInset={insets.top} />
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          <Text className="mt-3 text-center text-[15px] text-gray-600">{loadError}</Text>
        </View>
      </View>
    );
  }

  if (!trip) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={BLUE} />
      </View>
    );
  }

  if (trip.status === "pending" || trip.status === "generating") {
    const stepIndex = Math.min(Math.floor(loadingTick / STEP_TICKS), LOADING_STEPS.length - 1);
    const stepMessages = LOADING_MESSAGES[stepIndex];
    const message = stepMessages[loadingTick % stepMessages.length];

    return (
      <View className="flex-1 items-center justify-center bg-white px-10" style={{ paddingTop: insets.top + 24 }}>
        <Image source={MAP_PIN_IMAGE} contentFit="contain" style={{ width: 210, height: 155 }} />

        <Text className="mt-7 text-center text-[24px] font-extrabold text-[#12141F]">
          Planning your trip
        </Text>
        <Text className="mt-1.5 text-center text-[15px] text-gray-500">
          {trip.numDays} days in {trip.destination}
        </Text>

        <View className="mt-9 flex-row items-start justify-center">
          {LOADING_STEPS.map((step, i) => (
            <View key={step.key} className="flex-row items-start">
              <View className="items-center" style={{ width: 84 }}>
                <View
                  className="h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: i === stepIndex ? BLUE : "#F1F2F4" }}
                >
                  <Ionicons
                    name={step.icon}
                    size={22}
                    color={i === stepIndex ? "#ffffff" : "#9CA3AF"}
                  />
                </View>
                <Text
                  className="mt-2 text-center text-[12px] leading-[15px]"
                  style={{
                    color: i === stepIndex ? "#12141F" : "#9CA3AF",
                    fontWeight: i === stepIndex ? "700" : "500",
                  }}
                >
                  {step.label}
                </Text>
              </View>
              {i < LOADING_STEPS.length - 1 ? (
                <View className="mt-7 h-[1.5px] w-5" style={{ backgroundColor: "#E5E7EB" }} />
              ) : null}
            </View>
          ))}
        </View>

        <Text className="mt-8 text-center text-[15px] font-semibold" style={{ color: BLUE }}>
          {message}
        </Text>
      </View>
    );
  }

  if (trip.status === "failed") {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title={trip.destination} topInset={insets.top} />
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          <Text className="mt-4 text-center text-[18px] font-extrabold text-[#12141F]">
            Couldn&apos;t generate this trip
          </Text>
          {trip.errorMessage ? (
            <Text className="mt-2 text-center text-[14px] text-gray-500">
              {trip.errorMessage}
            </Text>
          ) : null}
          <Pressable
            onPress={handleRetry}
            disabled={isRetrying}
            className="mt-6 h-12 flex-row items-center justify-center gap-2 rounded-full px-8 active:opacity-90"
            style={{ backgroundColor: BLUE }}
          >
            {isRetrying ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-[15px] font-bold text-white">Try again</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  const itinerary = trip.itinerary;
  const budgetBreakdown = trip.budgetBreakdown;

  const city = shortCityName(trip.destination);

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        <View style={{ height: 320 }} className="overflow-hidden">
          {trip.coverImageUrl ? (
            <Image
              source={{ uri: trip.coverImageUrl }}
              contentFit="cover"
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <View style={{ width: "100%", height: "100%", backgroundColor: "#B9CDF7" }} />
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.62)"]}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />

          <View
            style={{
              position: "absolute",
              left: "-30%",
              right: "-30%",
              bottom: -58,
              height: 92,
              borderRadius: 999,
              backgroundColor: "#ffffff",
            }}
          />

          <View
            style={{ position: "absolute", top: insets.top + 8, left: 16, right: 16 }}
            className="flex-row items-center justify-between"
          >
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-80"
            >
              <Ionicons name="chevron-back" size={22} color="#12141F" />
            </Pressable>
            <Pressable
              onPress={handleDeletePress}
              disabled={isDeleting}
              className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-80 disabled:opacity-60"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Ionicons name="trash-outline" size={19} color="#EF4444" />
              )}
            </Pressable>
          </View>

          <View style={{ position: "absolute", left: 24, right: 24, bottom: 44 }}>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="location-sharp" size={14} color="#ffffff" />
              <Text className="text-[14px] font-semibold text-white">{city}</Text>
            </View>
            <Text className="mt-1 text-[32px] font-extrabold leading-[36px] text-white">
              {trip.numDays} Days in {city}
            </Text>
            {trip.coverImageAttributionName ? (
              <Text className="mt-2 text-right text-[11px] text-white/80">
                Photo by{" "}
                <Text className="font-bold text-white">{trip.coverImageAttributionName}</Text> on
                Unsplash
              </Text>
            ) : null}
          </View>
        </View>

        <View className="mt-2 flex-row items-start justify-around px-4">
          <StatItem icon="calendar-outline" value={`${trip.numDays} days`} label="Duration" />
          <StatItem
            icon="people-outline"
            value={`${trip.numTravelers}`}
            label={trip.numTravelers === 1 ? "Traveler" : "Travelers"}
          />
          {budgetBreakdown ? (
            <StatItem
              icon="wallet-outline"
              value={formatCurrency(budgetBreakdown.totalPerPerson, budgetBreakdown.currency)}
              label={"/ person\nBudget"}
            />
          ) : null}
        </View>

        {budgetBreakdown ? (
          <View className="mt-8 px-6">
            <Text className="text-[20px] font-extrabold text-[#12141F]">Budget breakdown</Text>
            <View className="mt-3 rounded-2xl border border-gray-200 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] text-gray-500">Total per person</Text>
                <Text className="text-[15px] font-bold text-[#12141F]">
                  {formatCurrency(budgetBreakdown.totalPerPerson, budgetBreakdown.currency)}
                </Text>
              </View>
              <View className="mt-1.5 flex-row items-center justify-between">
                <Text className="text-[14px] text-gray-500">Total for group</Text>
                <Text className="text-[15px] font-bold text-[#12141F]">
                  {formatCurrency(budgetBreakdown.totalForGroup, budgetBreakdown.currency)}
                </Text>
              </View>

              <View className="mt-4 gap-2.5 border-t border-gray-100 pt-4">
                {budgetBreakdown.categories.map((cat) => (
                  <View key={cat.label} className="flex-row items-center justify-between">
                    <Text className="text-[14px] text-gray-600">{cat.label}</Text>
                    <Text className="text-[14px] font-semibold text-[#12141F]">
                      {formatCurrency(cat.amountPerPerson, budgetBreakdown.currency)} / person
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : null}

        {itinerary ? (
          <View className="mt-8 px-6">
            <Text className="text-[20px] font-extrabold text-[#12141F]">Map</Text>
            <TripMapCard itinerary={itinerary} />
          </View>
        ) : null}

        <View className="mt-8 px-6">
          <Text className="text-[20px] font-extrabold text-[#12141F]">Itinerary</Text>
          <Text className="mt-0.5 text-[14px] text-gray-500">Your day-by-day plan</Text>

          <View className="mt-4 gap-3">
            {itinerary?.days.map((day, i) => (
              <DayCard
                key={day.day}
                day={day}
                expanded={expandedDay === day.day || (expandedDay === null && i === 0)}
                onToggle={() =>
                  setExpandedDay((current) => (current === day.day ? -1 : day.day))
                }
              />
            ))}
          </View>

          {itinerary && itinerary.hotels.length > 0 ? (
            <View className="mt-8">
              <Text className="text-[20px] font-extrabold text-[#12141F]">Hotels</Text>
              <View className="mt-4 gap-3">
                {itinerary.hotels.map((hotel, i) => (
                  <View
                    key={`${hotel.name}-${i}`}
                    className="rounded-2xl border border-gray-200 p-3"
                  >
                    <Text className="text-[15px] font-bold text-[#12141F]">{hotel.name}</Text>
                    <Text className="mt-1 text-[13px] text-gray-500">{hotel.description}</Text>
                    <Text className="mt-1 text-[13px] font-semibold" style={{ color: BLUE }}>
                      {hotel.priceRange}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Pressable
        className="active:opacity-90"
        style={{ position: "absolute", right: 20, bottom: insets.bottom + 20 }}
      >
        <Image source={AI_LOGO_IMAGE} contentFit="contain" style={{ width: 56, height: 56 }} />
      </Pressable>
    </View>
  );
}
