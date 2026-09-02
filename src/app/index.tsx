import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useAuth, useSSO, useUser } from "@clerk/expo";
import Svg, { Path } from "react-native-svg";

const BG_IMAGE = require("../../assets/images/auth-screen-bg.png");

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </Svg>
  );
}

function AppleIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path
        fill="#000000"
        d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zm3.061-2.83c.83-1.011 1.409-2.42 1.253-3.816-1.221.052-2.703.822-3.583 1.833-.777.86-1.457 2.284-1.279 3.61 1.291.104 2.649-.633 3.609-1.627z"
      />
    </Svg>
  );
}

type OAuthStrategy = "oauth_google" | "oauth_apple";

function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 bg-[#02202c]">
      <StatusBar style="light" />
      <Image
        source={BG_IMAGE}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={[
          "transparent",
          "transparent",
          "rgba(1,25,35,0.55)",
          "rgba(1,25,35,0.88)",
          "#02202c",
        ]}
        locations={[0, 0.42, 0.62, 0.82, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

function SignedInScreen() {
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
    <AuthBackground>
      <SafeAreaView edges={["bottom"]} className="flex-1 justify-end">
        <View className="px-8 pb-4">
          <Text className="text-center text-[30px] font-bold leading-[36px] text-white">
            You&apos;re signed in
          </Text>
          <Text className="mt-4 text-center text-[17px] text-white/90">
            {user?.primaryEmailAddress?.emailAddress ??
              user?.fullName ??
              "Welcome back"}
          </Text>

          <View className="mt-9">
            <Pressable
              onPress={handleSignOut}
              disabled={signingOut}
              className="h-14 flex-row items-center justify-center rounded-full bg-white active:opacity-90 disabled:opacity-60"
            >
              {signingOut ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Text className="text-[17px] font-semibold text-[#1A1A1A]">
                  Sign out
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </AuthBackground>
  );
}

function SignInScreen() {
  const { startSSOFlow } = useSSO();
  const [pendingStrategy, setPendingStrategy] = useState<OAuthStrategy | null>(
    null,
  );

  const handleSSO = async (strategy: OAuthStrategy) => {
    if (pendingStrategy) return;
    setPendingStrategy(strategy);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
      // No createdSessionId → user cancelled the flow; nothing to do.
    } catch (err) {
      console.error(`SSO error (${strategy}):`, JSON.stringify(err, null, 2));
    } finally {
      setPendingStrategy(null);
    }
  };

  return (
    <AuthBackground>
      <SafeAreaView edges={["bottom"]} className="flex-1 justify-end">
        <View className="px-8 pb-4">
          <Text className="text-center text-[30px] font-bold leading-[36px] text-white">
            Your next{"\n"}adventure starts here
          </Text>

          <View className="mt-9 gap-3">
            <Pressable
              onPress={() => handleSSO("oauth_google")}
              disabled={pendingStrategy !== null}
              className="h-14 flex-row items-center justify-center rounded-full bg-white active:opacity-90 disabled:opacity-60"
            >
              {pendingStrategy === "oauth_google" ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <>
                  <View style={{ marginRight: 10 }}>
                    <GoogleIcon />
                  </View>
                  <Text className="text-[17px] font-semibold text-[#1A1A1A]">
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => handleSSO("oauth_apple")}
              disabled={pendingStrategy !== null}
              className="h-14 flex-row items-center justify-center rounded-full bg-white active:opacity-90 disabled:opacity-60"
            >
              {pendingStrategy === "oauth_apple" ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <>
                  <View style={{ marginRight: 10 }}>
                    <AppleIcon />
                  </View>
                  <Text className="text-[17px] font-semibold text-[#1A1A1A]">
                    Continue with Apple
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <Text className="mt-6 text-center text-[13px] leading-[18px] text-white/80">
            By continuing, you agree to our{"\n"}
            <Text className="text-[#2E9BFF]">Terms of Service</Text>
            <Text> and </Text>
            <Text className="text-[#2E9BFF]">Privacy Policy</Text>
          </Text>
        </View>
      </SafeAreaView>
    </AuthBackground>
  );
}

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <AuthBackground>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#ffffff" />
        </View>
      </AuthBackground>
    );
  }

  return isSignedIn ? <SignedInScreen /> : <SignInScreen />;
}
