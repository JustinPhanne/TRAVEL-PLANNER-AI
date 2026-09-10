import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenHeader } from "@/components/screen-header";
import { getLanguageCode, saveLanguageCode } from "@/lib/preferences";

const BLUE = "#3B7CF0";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
];

export default function LanguageScreen() {
  const [code, setCode] = useState("en");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await getLanguageCode();
      if (!cancelled) {
        setCode(saved);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = (next: string) => {
    setCode(next);
    saveLanguageCode(next);
  };

  if (!loaded) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title="Language" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Language" />

      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-4 mt-2 text-[13px] leading-[19px] text-gray-400">
          Triply&apos;s interface is only available in English today. Your
          pick is saved and we&apos;ll use it once more languages ship.
        </Text>

        <View className="overflow-hidden rounded-[22px] border border-black/5 bg-white">
          {LANGUAGES.map((language, i) => {
            const selected = language.code === code;
            return (
              <Pressable
                key={language.code}
                onPress={() => handleSelect(language.code)}
                className={`flex-row items-center px-4 py-4 active:opacity-60 ${
                  i === LANGUAGES.length - 1 ? "" : "border-b border-black/5"
                }`}
              >
                <Text className="flex-1 text-[16px] text-[#12141F]">
                  {language.label}
                </Text>
                {selected && (
                  <Ionicons name="checkmark-circle" size={22} color={BLUE} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
