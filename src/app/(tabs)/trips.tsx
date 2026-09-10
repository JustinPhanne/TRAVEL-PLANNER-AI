import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";

import type { SelectTrip } from "@/db/schema";
import { Sentry } from "@/lib/sentry";

const BLUE = "#3B7CF0";

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

function shortCityName(destination: string) {
  return destination.split(",")[0]?.trim() || destination;
}

async function fetchTrips(token: string | null): Promise<SelectTrip[]> {
  const res = await fetch("/api/trips", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as SelectTrip[];
}

function TripCard({ trip }: { trip: SelectTrip }) {
  const city = shortCityName(trip.destination);
  const budget = trip.budgetBreakdown;

  return (
    <Pressable
      onPress={() => router.push(`/trip/${trip.id}`)}
      className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm shadow-black/10 active:opacity-90"
    >
      <View>
        {trip.coverImageUrl ? (
          <Image
            source={{ uri: trip.coverImageUrl }}
            contentFit="cover"
            style={{ width: "100%", aspectRatio: 1.85 }}
          />
        ) : (
          <View style={{ width: "100%", aspectRatio: 1.85, backgroundColor: "#B9CDF7" }} />
        )}

        <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded-full bg-black/45 px-3 py-1.5">
          <Ionicons name="calendar-outline" size={14} color="#ffffff" />
          <Text className="text-[13px] font-bold text-white">{trip.numDays} days</Text>
        </View>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.78)"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingTop: 56,
            paddingBottom: 16,
          }}
        >
          <Text className="text-[22px] font-extrabold text-white">
            {trip.numDays} Days in {city}
          </Text>
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="location-sharp" size={14} color="#ffffff" />
            <Text className="text-[14px] text-white/90">{city}</Text>
          </View>
        </LinearGradient>
      </View>

      <View className="flex-row items-center justify-between px-4 py-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="wallet-outline" size={18} color="#6B7280" />
          <Text className="text-[15px] font-medium text-gray-600">
            {budget
              ? `Est. ${formatCurrency(budget.totalPerPerson, budget.currency)} / person`
              : "Estimate pending..."}
          </Text>
        </View>
        <View className="flex-row items-center gap-0.5">
          <Text className="text-[15px] font-semibold text-[#3B7CF0]">View</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B7CF0" />
        </View>
      </View>
    </Pressable>
  );
}

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [trips, setTrips] = useState<SelectTrip[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchTrips(await getToken());
        if (!cancelled) {
          setTrips(data);
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          Sentry.logger.error(Sentry.logger.fmt`Trips list load failed: ${err}`, {});
          setLoadError(err instanceof Error ? err.message : "Something went wrong.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchTrips(await getToken());
      setTrips(data);
      setLoadError(null);
    } catch (err) {
      Sentry.logger.error(Sentry.logger.fmt`Trips list refresh failed: ${err}`, {});
      setLoadError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!trips && !loadError) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={BLUE} />
      </View>
    );
  }

  if (loadError && !trips) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-10">
        <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
        <Text className="mt-3 text-center text-[15px] text-gray-600">{loadError}</Text>
      </View>
    );
  }

  const tripList = trips ?? [];

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="pb-10"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={BLUE} />
      }
    >
      <Text
        style={{ paddingTop: insets.top + 8 }}
        className="px-6 text-[32px] font-extrabold text-[#12141F]"
      >
        Trips
      </Text>
      <Text className="mt-0.5 px-6 text-[15px] text-gray-500">
        {tripList.length} {tripList.length === 1 ? "trip" : "trips"} planned
      </Text>

      {tripList.length === 0 ? (
        <View className="mt-16 items-center px-10">
          <Ionicons name="map-outline" size={40} color="#9CA3AF" />
          <Text className="mt-3 text-center text-[15px] text-gray-500">
            No trips yet. Start planning your next adventure.
          </Text>
        </View>
      ) : (
        <View className="mt-6 gap-6 px-6">
          {tripList.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
