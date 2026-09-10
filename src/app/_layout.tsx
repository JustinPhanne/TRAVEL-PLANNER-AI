import "../../global.css";

import { useEffect } from "react";
import { Appearance } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";

import { getAppearanceMode } from "@/lib/preferences";
import { Sentry } from "@/lib/sentry";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file");
}

function RootLayout() {
  useEffect(() => {
    getAppearanceMode().then((mode) => {
      Appearance.setColorScheme(mode === "system" ? "unspecified" : mode);
    });
  }, []);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

export default Sentry.wrap(RootLayout);
