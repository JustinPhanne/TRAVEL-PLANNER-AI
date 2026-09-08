import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

const WORLD_IMAGE = require("../../../design/world.png");

const TRIP = {
  title: "3 Days in Osaka",
  location: "Osaka",
  days: 3,
  estPerPerson: 540,
  image: "https://picsum.photos/seed/osaka-triply/900/560",
};

const DESTINATIONS = [
  {
    name: "Santorini",
    country: "Greece",
    rating: 4.9,
    image: "https://picsum.photos/seed/santorini-triply/500/650",
  },
  {
    name: "Kyoto",
    country: "Japan",
    rating: 4.8,
    image: "https://picsum.photos/seed/kyoto-triply/500/650",
  },
  {
    name: "Bali",
    country: "Indonesia",
    rating: 4.7,
    image: "https://picsum.photos/seed/bali-triply/500/650",
  },
];

export default function HomeScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="pb-10"
      showsVerticalScrollIndicator={false}
    >
      <Text className="px-6 pt-2 text-[32px] font-extrabold text-[#12141F]">
        Hi, Burak 👋
      </Text>

      <View className="mx-6 mt-6">
        <LinearGradient
          colors={["#5C90F6", "#3B60E0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 28, paddingHorizontal: 24, paddingVertical: 24 }}
        >
          <View style={{ width: "62%" }}>
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="sparkles" size={16} color="#ffffff" />
              <Text className="text-[15px] font-bold text-white">
                AI Trip Planner
              </Text>
            </View>

            <Text className="mt-2 text-[27px] font-extrabold leading-[32px] text-white">
              Plan your next trip
            </Text>

            <Text className="mt-2 text-[15px] leading-[21px] text-white/85">
              Tell us where and when — we&apos;ll build the itinerary.
            </Text>

            <Pressable
              onPress={() => router.push("/generate-trip")}
              className="mt-5 h-12 flex-row items-center justify-center gap-2 self-start rounded-full bg-white px-6 active:opacity-90"
            >
              <Text className="text-[16px] font-bold text-[#1E3A8A]">
                Get started
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#1E3A8A" />
            </Pressable>
          </View>

          <Image
            source={WORLD_IMAGE}
            contentFit="contain"
            style={{
              position: "absolute",
              right: -15,
              top: 50,
              width: 200,
              height: 172,
            }}
          />
        </LinearGradient>
      </View>

      <View className="mt-8 flex-row items-center justify-between px-6">
        <Text className="text-[22px] font-extrabold text-[#12141F]">
          Your trips
        </Text>
        <Pressable className="flex-row items-center gap-0.5">
          <Text className="text-[15px] font-semibold text-[#3B7CF0]">
            See all
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#3B7CF0" />
        </Pressable>
      </View>

      <View className="mx-6 mt-4 overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm shadow-black/10">
        <View>
          <Image
            source={{ uri: TRIP.image }}
            contentFit="cover"
            style={{ width: "100%", aspectRatio: 1.9 }}
          />

          <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded-full bg-black/45 px-3 py-1.5">
            <Ionicons name="calendar-outline" size={14} color="#ffffff" />
            <Text className="text-[13px] font-bold text-white">
              {TRIP.days} days
            </Text>
          </View>

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.78)"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: 16,
              paddingTop: 56,
              paddingBottom: 16,
            }}
          >
            <Text className="text-[22px] font-extrabold text-white">
              {TRIP.title}
            </Text>
            <View className="mt-1 flex-row items-center gap-1">
              <Ionicons name="location-sharp" size={14} color="#ffffff" />
              <Text className="text-[14px] text-white/90">
                {TRIP.location}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View className="flex-row items-center justify-between px-4 py-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="briefcase-outline" size={18} color="#6B7280" />
            <Text className="text-[15px] font-medium text-gray-600">
              Est. ${TRIP.estPerPerson} / person
            </Text>
          </View>
          <Pressable className="flex-row items-center gap-0.5">
            <Text className="text-[15px] font-semibold text-[#3B7CF0]">
              View
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#3B7CF0" />
          </Pressable>
        </View>
      </View>

      <Text className="mt-8 px-6 text-[22px] font-extrabold text-[#12141F]">
        Popular destinations
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4"
        contentContainerClassName="gap-3 px-6"
      >
        {DESTINATIONS.map((destination) => (
          <View
            key={destination.name}
            className="overflow-hidden rounded-[22px]"
          >
            <Image
              source={{ uri: destination.image }}
              contentFit="cover"
              style={{ width: 155, height: 200 }}
            />

            <View className="absolute right-2 top-2 flex-row items-center gap-1 rounded-full bg-black/45 px-2.5 py-1">
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text className="text-[12px] font-bold text-white">
                {destination.rating}
              </Text>
            </View>

            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.72)"]}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                paddingHorizontal: 12,
                paddingTop: 40,
                paddingBottom: 12,
              }}
            >
              <Text className="text-[17px] font-extrabold text-white">
                {destination.name}
              </Text>
              <Text className="text-[12px] text-white/85">
                {destination.country}
              </Text>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}
