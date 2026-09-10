import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { ScreenHeader } from "@/components/screen-header";
import {
  DEFAULT_TRAVEL_PREFERENCES,
  getTravelPreferences,
  saveTravelPreferences,
  type TravelPreferences,
} from "@/lib/preferences";
import {
  BUDGET_TIER_LABELS,
  BUDGET_TIER_VALUES,
  BUDGET_TIERS,
  INTERESTS,
  TRAVEL_PACE_LABELS,
  TRAVEL_PACE_VALUES,
  TRAVEL_PACES,
} from "@/lib/travel-options";

const BLUE = "#3B7CF0";

export default function TravelPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const [loaded, setLoaded] = useState(false);
  const [prefs, setPrefs] = useState<TravelPreferences>(DEFAULT_TRAVEL_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await getTravelPreferences();
      if (!cancelled) {
        setPrefs(saved);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleInterest = (interest: string) => {
    setPrefs((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveTravelPreferences(prefs);
      router.back();
    } catch {
      Alert.alert("Couldn't save", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!loaded) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Travel preferences" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Travel preferences" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-3 mt-2 text-[15px] font-bold text-[#12141F]">
          Budget (per person)
        </Text>
        <View className="flex-row gap-2">
          {BUDGET_TIERS.map((tier) => {
            const selected = BUDGET_TIER_VALUES[tier] === prefs.budgetTier;
            return (
              <Pressable
                key={tier}
                onPress={() =>
                  setPrefs((prev) => ({ ...prev, budgetTier: BUDGET_TIER_VALUES[tier] }))
                }
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

        <Text className="mb-3 mt-6 text-[15px] font-bold text-[#12141F]">
          Travel pace
        </Text>
        <View className="flex-row gap-2">
          {TRAVEL_PACES.map((pace) => {
            const selected = TRAVEL_PACE_VALUES[pace] === prefs.travelPace;
            return (
              <Pressable
                key={pace}
                onPress={() =>
                  setPrefs((prev) => ({ ...prev, travelPace: TRAVEL_PACE_VALUES[pace] }))
                }
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
                  {pace}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mb-3 mt-6 text-[15px] font-bold text-[#12141F]">
          Interests
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const selected = prefs.interests.includes(interest);
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

        <Text className="mt-6 text-[13px] leading-[19px] text-gray-400">
          These prefill the defaults when you plan a new trip with{" "}
          {BUDGET_TIER_LABELS[prefs.budgetTier]} budget and{" "}
          {TRAVEL_PACE_LABELS[prefs.travelPace]} pace.
        </Text>
      </ScrollView>

      <View
        style={{ paddingBottom: insets.bottom + 12 }}
        className="border-t border-gray-100 px-6 pt-3"
      >
        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          className="h-14 flex-row items-center justify-center rounded-full active:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: BLUE }}
        >
          <Text className="text-[16px] font-bold text-white">
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
