import { ScrollView, Text, View } from "react-native";

import { ScreenHeader } from "@/components/screen-header";

export type LegalSection = {
  heading: string;
  body: string;
};

export function LegalScreen({
  title,
  updatedAt,
  sections,
}: {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={title} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-6 text-[13px] text-gray-400">
          Last updated {updatedAt}
        </Text>
        {sections.map((section) => (
          <View key={section.heading} className="mb-6">
            <Text className="mb-2 text-[16px] font-bold text-[#12141F]">
              {section.heading}
            </Text>
            <Text className="text-[15px] leading-[22px] text-gray-600">
              {section.body}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
