import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { ScrollView, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenHeader } from "@/components/screen-header";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from "@/lib/preferences";

const BLUE = "#3B7CF0";

type IconName = ComponentProps<typeof Ionicons>["name"];

const ROWS: {
  key: keyof NotificationSettings;
  icon: IconName;
  label: string;
  description: string;
}[] = [
  {
    key: "pushEnabled",
    icon: "notifications-outline",
    label: "Push notifications",
    description: "Allow Triply to send you notifications.",
  },
  {
    key: "tripReminders",
    icon: "calendar-outline",
    label: "Trip reminders",
    description: "Upcoming departures and itinerary updates.",
  },
  {
    key: "priceAlerts",
    icon: "pricetag-outline",
    label: "Price drop alerts",
    description: "When flights or stays for a saved trip get cheaper.",
  },
  {
    key: "productUpdates",
    icon: "sparkles-outline",
    label: "Product updates & tips",
    description: "New features and travel planning tips.",
  },
];

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await getNotificationSettings();
      if (!cancelled) {
        setSettings(saved);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "pushEnabled" && !value) {
        next.tripReminders = false;
        next.priceAlerts = false;
        next.productUpdates = false;
      }
      saveNotificationSettings(next);
      return next;
    });
  };

  if (!loaded) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Notifications" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Notifications" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-2 overflow-hidden rounded-[22px] border border-black/5 bg-white">
          {ROWS.map((row, i) => {
            const disabled = row.key !== "pushEnabled" && !settings.pushEnabled;
            return (
              <View
                key={row.key}
                className={`flex-row items-center px-4 py-4 ${
                  i === ROWS.length - 1 ? "" : "border-b border-black/5"
                }`}
              >
                <Ionicons
                  name={row.icon}
                  size={20}
                  color={disabled ? "#D1D5DB" : "#6B7280"}
                />
                <View className="ml-3 flex-1">
                  <Text
                    className="text-[16px]"
                    style={{ color: disabled ? "#9CA3AF" : "#12141F" }}
                  >
                    {row.label}
                  </Text>
                  <Text className="mt-0.5 text-[13px] text-gray-400">
                    {row.description}
                  </Text>
                </View>
                <Switch
                  value={settings[row.key]}
                  onValueChange={(value) => handleToggle(row.key, value)}
                  disabled={disabled}
                  trackColor={{ true: BLUE, false: "#E5E7EB" }}
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
