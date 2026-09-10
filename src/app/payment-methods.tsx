import { Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenHeader } from "@/components/screen-header";

const BLUE = "#3B7CF0";

export default function PaymentMethodsScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Payment methods" />

      <View className="flex-1 items-center justify-center px-10">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#EAF1FE]">
          <Ionicons name="card-outline" size={28} color={BLUE} />
        </View>
        <Text className="mt-4 text-[17px] font-bold text-[#12141F]">
          No payment methods yet
        </Text>
        <Text className="mt-2 text-center text-[14px] leading-[20px] text-gray-500">
          Saved cards will show up here so you can check out faster. We
          haven&apos;t turned on payments in Triply yet.
        </Text>

        <Pressable
          onPress={() =>
            Alert.alert(
              "Coming soon",
              "Adding a payment method isn't available yet.",
            )
          }
          className="mt-6 flex-row items-center gap-2 rounded-full border px-6 py-3.5 active:opacity-70"
          style={{ borderColor: BLUE }}
        >
          <Ionicons name="add" size={18} color={BLUE} />
          <Text className="text-[15px] font-bold" style={{ color: BLUE }}>
            Add payment method
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
