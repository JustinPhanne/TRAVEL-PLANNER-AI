import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SelectTrip } from "@/db/schema";
import { Sentry } from "@/lib/sentry";

const BLUE = "#3B7CF0";
const NAVY = "#1E3A8A";
const DARK = "#12141F";

type IconName = ComponentProps<typeof Ionicons>["name"];

type TripStats = { trips: number; countries: number; daysAway: number };

function extractCountry(destination: string) {
  const parts = destination.split(",");
  return parts[parts.length - 1]?.trim() || destination.trim();
}

async function fetchTripStats(token: string | null): Promise<TripStats> {
  const res = await fetch("/api/trips", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const trips = (await res.json()) as SelectTrip[];
  const readyTrips = trips.filter((trip) => trip.status === "ready");
  const countries = new Set(
    readyTrips.map((trip) => extractCountry(trip.destination).toLowerCase()),
  );
  return {
    trips: readyTrips.length,
    countries: countries.size,
    daysAway: readyTrips.reduce((sum, trip) => sum + trip.numDays, 0),
  };
}

function getInitial(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim();
  return source ? source[0]!.toUpperCase() : "?";
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 mt-6 px-1 text-[14px] font-semibold text-gray-400">
      {children}
    </Text>
  );
}

function GroupedCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-[22px] border border-black/5 bg-white">
      {children}
    </View>
  );
}

function Row({
  icon,
  label,
  onPress,
  isLast = false,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-4 active:opacity-60 ${
        isLast ? "" : "border-b border-black/5"
      }`}
    >
      <Ionicons name={icon} size={20} color="#6B7280" />
      <Text className="ml-3 flex-1 text-[16px] text-[#12141F]">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#C4C7CD" />
    </Pressable>
  );
}

function ActionButton({
  icon,
  label,
  loadingLabel,
  danger,
  loading,
  onPress,
}: {
  icon: IconName;
  label: string;
  loadingLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onPress?: () => void;
}) {
  const color = danger ? "#EF4444" : DARK;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center justify-center rounded-[22px] border border-black/5 bg-white px-4 py-4 active:opacity-60 disabled:opacity-60"
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text
        className="ml-2 text-[16px] font-semibold"
        style={{ color }}
      >
        {loading ? loadingLabel ?? label : label}
      </Text>
    </Pressable>
  );
}

function StatDivider() {
  return <View className="h-10 w-px bg-black/10" />;
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: number;
  label: string;
}) {
  return (
    <View className="flex-1 items-center">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-[#EAF1FE]">
        <Ionicons name={icon} size={18} color={BLUE} />
      </View>
      <Text className="mt-2 text-[22px] font-extrabold text-[#12141F]">
        {value}
      </Text>
      <Text className="mt-0.5 text-[13px] text-gray-500">{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [stats, setStats] = useState<TripStats>({
    trips: 0,
    countries: 0,
    daysAway: 0,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchTripStats(await getToken());
        if (!cancelled) setStats(data);
      } catch (err) {
        Sentry.logger.error(
          Sentry.logger.fmt`Profile stats load failed: ${err}`,
          {},
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/");
    } finally {
      setSigningOut(false);
    }
  };

  const performDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      await signOut();
      router.replace("/");
    } catch (err) {
      Sentry.logger.error(Sentry.logger.fmt`Account deletion failed: ${err}`, {});
      Alert.alert(
        "Something went wrong",
        "We couldn't delete your account. Please try again.",
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "This will permanently delete your account and all of your trips. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: performDeleteAccount,
        },
      ],
    );
  };

  const handleRate = async () => {
    try {
      await Share.share({
        message:
          "I've been planning trips with Triply — an AI trip planner that builds your itinerary for you. Worth a look!",
      });
    } catch {
      Alert.alert("Couldn't open share sheet", "Please try again.");
    }
  };

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message:
          "Join me on Triply, an AI trip planner that builds your itinerary and budget for you.",
      });
    } catch {
      Alert.alert("Couldn't open share sheet", "Please try again.");
    }
  };

  const name = user?.fullName ?? "Traveler";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = getInitial(user?.fullName, email);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="pb-10"
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={{ paddingTop: insets.top - 50}}
        className="px-6 text-[32px] font-extrabold text-[#12141F]"
      >
        Profile
      </Text>

      <View className="px-6">
        <View className="mt-5 flex-row items-center rounded-[22px] border border-black/5 bg-white px-4 py-4">
          <View
            className="h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: NAVY }}
          >
            <Text className="text-[26px] font-bold text-white">{initial}</Text>
          </View>

          <View className="ml-4 flex-1">
            <Text className="text-[19px] font-bold text-[#12141F]">
              {name}
            </Text>
            {!!email && (
              <Text className="mt-0.5 text-[15px] text-gray-500">
                {email}
              </Text>
            )}
          </View>
        </View>

        <View className="mt-4 flex-row items-center rounded-[22px] border border-black/5 bg-white px-4 py-5">
          <StatItem icon="paper-plane-outline" value={stats.trips} label="Trips" />
          <StatDivider />
          <StatItem
            icon="globe-outline"
            value={stats.countries}
            label="Countries"
          />
          <StatDivider />
          <StatItem
            icon="calendar-outline"
            value={stats.daysAway}
            label="Days away"
          />
        </View>

        <SectionLabel>Account</SectionLabel>
        <GroupedCard>
          <Row
            icon="options-outline"
            label="Travel preferences"
            onPress={() => router.push("/travel-preferences")}
          />
          <Row
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push("/notification-settings")}
          />
          <Row
            icon="card-outline"
            label="Payment methods"
            onPress={() => router.push("/payment-methods")}
            isLast
          />
        </GroupedCard>

        <SectionLabel>Preferences</SectionLabel>
        <GroupedCard>
          <Row
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push("/settings")}
          />
          <Row
            icon="moon-outline"
            label="Appearance"
            onPress={() => router.push("/appearance")}
          />
          <Row
            icon="language-outline"
            label="Language"
            onPress={() => router.push("/language")}
            isLast
          />
        </GroupedCard>

        <SectionLabel>Support</SectionLabel>
        <GroupedCard>
          <Row
            icon="help-circle-outline"
            label="Help & support"
            onPress={() => router.push("/help-support")}
          />
          <Row
            icon="shield-checkmark-outline"
            label="Privacy policy"
            onPress={() => router.push("/privacy-policy")}
          />
          <Row
            icon="document-text-outline"
            label="Terms of service"
            onPress={() => router.push("/terms-of-service")}
          />
          <Row icon="star-outline" label="Rate Triply" onPress={handleRate} />
          <Row
            icon="gift-outline"
            label="Invite friends"
            onPress={handleInviteFriends}
            isLast
          />
        </GroupedCard>

        <View className="mt-6">
          <ActionButton
            icon="log-out-outline"
            label="Log out"
            loadingLabel="Signing out..."
            loading={signingOut}
            onPress={handleSignOut}
          />
        </View>

        <View className="mt-3">
          <ActionButton
            icon="trash-outline"
            label="Delete account"
            loadingLabel="Deleting..."
            danger
            loading={deletingAccount}
            onPress={handleDeleteAccount}
          />
        </View>

        <Text className="mt-6 text-center text-[13px] text-gray-400">
          Triply v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
