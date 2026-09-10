import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export function ScreenHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();

  return (
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
        {title}
      </Text>
      <View className="h-10 w-10" />
    </View>
  );
}
