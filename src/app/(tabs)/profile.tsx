import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useAuth, useUser } from "@clerk/expo";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-[20px] font-extrabold text-[#12141F]">
        {user?.fullName ?? "Profile"}
      </Text>
      <Text className="mt-2 text-center text-[15px] text-gray-500">
        {user?.primaryEmailAddress?.emailAddress}
      </Text>

      <Pressable
        onPress={handleSignOut}
        disabled={signingOut}
        className="mt-8 h-14 w-full flex-row items-center justify-center rounded-full bg-[#12141F] active:opacity-90 disabled:opacity-60"
      >
        {signingOut ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-[17px] font-semibold text-white">
            Sign out
          </Text>
        )}
      </Pressable>
    </View>
  );
}
