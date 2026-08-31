import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@/lib/tokenCache";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { PostHogErrorBoundary, PostHogProvider } from "posthog-react-native";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { posthog } from "@/lib/posthog";
import { SubscriptionsProvider } from "@/context/SubscriptionsContext";
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Please set this in your environment variables or .env file."
  );
}

function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const identifiedUserId = useRef<string | null | undefined>(undefined);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user?.id) {
      if (identifiedUserId.current !== null) {
        posthog?.reset();
        identifiedUserId.current = null;
      }
      return;
    }

    if (identifiedUserId.current === user.id) return;

    const personProperties: Record<string, string> = {};
    const email = user.primaryEmailAddress?.emailAddress;
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

    if (email) personProperties.email = email;
    if (name) personProperties.name = name;

    posthog?.identify(user.id, { $set: personProperties });
    identifiedUserId.current = user.id;
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isPublicSegment = segments[0] === "onboarding";

    if (!isSignedIn && !inAuthGroup && !isPublicSegment) {
      router.replace("/(auth)/sign-in");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isSignedIn, isLoaded, segments, router]);

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff9e3",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color="#ea7a53" size="large" />
      </View>
    );
  }

  return (
    <SubscriptionsProvider key={user?.id || "anonymous"}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#fff9e3" },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="subscriptions/[id]" options={{ headerShown: false }} />
      </Stack>
    </SubscriptionsProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "sans-regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-extrabold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff9e3",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator color="#ea7a53" size="large" />
      </View>
    );
  }

  const app = <AuthGate />;

  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      {posthog ? (
        <PostHogProvider client={posthog}>
          <PostHogErrorBoundary
            fallback={() => (
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff9e3",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator color="#ea7a53" size="large" />
              </View>
            )}
          >
            {app}
          </PostHogErrorBoundary>
        </PostHogProvider>
      ) : (
        app
      )}
    </ClerkProvider>
  );
}
