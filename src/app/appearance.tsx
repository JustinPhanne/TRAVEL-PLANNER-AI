import { useEffect, useState } from "react";
import { Appearance, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenHeader } from "@/components/screen-header";
import { getAppearanceMode, saveAppearanceMode, type AppearanceMode } from "@/lib/preferences";

const BLUE = "#3B7CF0";

const OPTIONS: { mode: AppearanceMode; label: string; description: string; icon: "phone-portrait-outline" | "sunny-outline" | "moon-outline" }[] = [
  {
    mode: "system",
    label: "System default",
    description: "Match your device's appearance setting.",
    icon: "phone-portrait-outline",
  },
  {
    mode: "light",
    label: "Light",
    description: "Always use light mode.",
    icon: "sunny-outline",
  },
  {
    mode: "dark",
    label: "Dark",
    description: "Always use dark mode.",
    icon: "moon-outline",
  },
];

export default function AppearanceScreen() {
  const [mode, setMode] = useState<AppearanceMode>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await getAppearanceMode();
      if (!cancelled) {
        setMode(saved);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = (next: AppearanceMode) => {
    setMode(next);
    saveAppearanceMode(next);
    Appearance.setColorScheme(next === "system" ? "unspecified" : next);
  };

  if (!loaded) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Appearance" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Appearance" />

      <View className="px-6">
        <View className="mt-2 overflow-hidden rounded-[22px] border border-black/5 bg-white">
          {OPTIONS.map((option, i) => {
            const selected = option.mode === mode;
            return (
              <Pressable
                key={option.mode}
                onPress={() => handleSelect(option.mode)}
                className={`flex-row items-center px-4 py-4 active:opacity-60 ${
                  i === OPTIONS.length - 1 ? "" : "border-b border-black/5"
                }`}
              >
                <Ionicons name={option.icon} size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-[16px] text-[#12141F]">{option.label}</Text>
                  <Text className="mt-0.5 text-[13px] text-gray-400">
                    {option.description}
                  </Text>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={22} color={BLUE} />
                )}
              </Pressable>
            );
          })}
        </View>

        <Text className="mt-4 text-[13px] leading-[19px] text-gray-400">
          Applies system-wide right away. Triply&apos;s own screens are
          optimized for light mode today, so some custom styling may not
          fully adapt yet.
        </Text>
      </View>
    </View>
  );
}
