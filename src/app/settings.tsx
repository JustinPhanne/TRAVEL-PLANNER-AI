import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";

import { ScreenHeader } from "@/components/screen-header";
import { clearAllPreferences } from "@/lib/preferences";

function InfoRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: "person-outline" | "mail-outline";
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center px-4 py-4 ${
        isLast ? "" : "border-b border-black/5"
      }`}
    >
      <Ionicons name={icon} size={20} color="#6B7280" />
      <Text className="ml-3 w-24 text-[15px] text-gray-500">{label}</Text>
      <Text className="flex-1 text-right text-[15px] font-medium text-[#12141F]" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { user } = useUser();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      "Clear cached preferences?",
      "This resets your travel preferences, notification, appearance, and language settings on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              await clearAllPreferences();
              Alert.alert("Done", "Cached preferences cleared.");
            } finally {
              setIsClearing(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Settings" />

      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-2 mt-2 px-1 text-[13px] font-semibold text-gray-400">
          Account
        </Text>
        <View className="overflow-hidden rounded-[22px] border border-black/5 bg-white">
          <InfoRow icon="person-outline" label="Name" value={user?.fullName ?? "—"} />
          <InfoRow
            icon="mail-outline"
            label="Email"
            value={user?.primaryEmailAddress?.emailAddress ?? "—"}
            isLast
          />
        </View>

        <Text className="mb-2 mt-6 px-1 text-[13px] font-semibold text-gray-400">
          Data
        </Text>
        <Pressable
          onPress={handleClearCache}
          disabled={isClearing}
          className="flex-row items-center rounded-[22px] border border-black/5 bg-white px-4 py-4 active:opacity-60 disabled:opacity-60"
        >
          <Ionicons name="trash-outline" size={20} color="#6B7280" />
          <Text className="ml-3 flex-1 text-[16px] text-[#12141F]">
            {isClearing ? "Clearing..." : "Clear cached preferences"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
