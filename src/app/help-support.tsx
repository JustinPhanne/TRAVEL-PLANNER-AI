import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenHeader } from "@/components/screen-header";

const BLUE = "#3B7CF0";
const SUPPORT_EMAIL = "support@triply.app";

const FAQS = [
  {
    question: "How do I plan a new trip?",
    answer:
      "Tap Get started on the Home tab or use the Assistant, tell us your destination, dates, budget, and interests, and we'll build a day-by-day itinerary for you.",
  },
  {
    question: "Can I change my trip after it's generated?",
    answer:
      "Not yet from within the app — regenerate a new trip with updated details for now. Editing existing itineraries is on our roadmap.",
  },
  {
    question: "Why is my trip stuck on \"generating\"?",
    answer:
      "Itineraries usually take under a minute. If it's been longer, pull to refresh on the Trips tab, or reach out below and we'll take a look.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "Go to Profile → Delete account. This permanently removes your account and all of your trips, and can't be undone.",
  },
];

async function handleContactSupport() {
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Help with Triply")}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) throw new Error("mailto unsupported");
    await Linking.openURL(url);
  } catch {
    Alert.alert("Couldn't open Mail", `Email us directly at ${SUPPORT_EMAIL}.`);
  }
}

export default function HelpSupportScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title="Help & support" />

      <ScrollView
        className="flex-1 px-6"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-3 mt-2 text-[15px] font-bold text-[#12141F]">
          Frequently asked questions
        </Text>
        <View className="overflow-hidden rounded-[22px] border border-black/5 bg-white">
          {FAQS.map((faq, i) => (
            <View
              key={faq.question}
              className={`px-4 py-4 ${i === FAQS.length - 1 ? "" : "border-b border-black/5"}`}
            >
              <Text className="text-[15px] font-semibold text-[#12141F]">
                {faq.question}
              </Text>
              <Text className="mt-1.5 text-[14px] leading-[20px] text-gray-500">
                {faq.answer}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleContactSupport}
          className="mt-6 flex-row items-center justify-center gap-2 rounded-full py-4 active:opacity-90"
          style={{ backgroundColor: BLUE }}
        >
          <Ionicons name="mail-outline" size={18} color="#ffffff" />
          <Text className="text-[16px] font-bold text-white">Contact support</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
