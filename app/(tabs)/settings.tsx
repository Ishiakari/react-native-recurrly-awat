import { colors } from "@/app/constants/theme";
import images from "@/app/constants/images";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { styled } from "nativewind";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const Image = styled(RNImage);

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : "Recurrly Member";
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "No email linked";

  const handleSignOut = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your Recurrly account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
              router.replace("/(auth)/sign-in");
            } catch (err) {
              console.error("Sign out error:", err);
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 110 }}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-sans-extrabold text-primary tracking-tight">Settings</Text>
          <Text className="text-sm font-sans-medium text-muted-foreground mt-1">
            Account preferences and subscription settings
          </Text>
        </View>

        {/* Profile Card */}
        <View className="rounded-3xl border border-border bg-card p-5 mb-6 shadow-sm">
          <View className="flex-row items-center gap-4">
            <View className="relative">
              <Image
                source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
                className="size-16 rounded-full border border-border"
              />
              <View className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-success border-2 border-card" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-xl font-sans-bold text-primary" numberOfLines={1}>
                {displayName}
              </Text>
              <Text className="text-sm font-sans-medium text-muted-foreground mt-0.5" numberOfLines={1}>
                {userEmail}
              </Text>
              <View className="mt-2.5 flex-row items-center gap-1.5 bg-subscription/25 px-2.5 py-1 rounded-full self-start">
                <Text className="text-[11px] font-sans-bold text-primary uppercase tracking-wider">
                  Pro Plan
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View className="mb-6">
          <Text className="text-xs font-sans-bold uppercase tracking-wider text-muted-foreground px-1 mb-2.5">
            Preferences
          </Text>

          <View className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center gap-3">
                <View className="size-10 rounded-2xl bg-accent/15 items-center justify-center">
                  <Ionicons name="notifications-outline" size={19} color={colors.accent} />
                </View>
                <View>
                  <Text className="font-sans-semibold text-base text-primary">Renewal Alerts</Text>
                  <Text className="font-sans-medium text-xs text-muted-foreground">
                    Push notifications 2 days prior
                  </Text>
                </View>
              </View>
              <View className="bg-accent/15 px-3 py-1 rounded-full">
                <Text className="font-sans-bold text-xs text-accent">Active</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center gap-3">
                <View className="size-10 rounded-2xl bg-primary/10 items-center justify-center">
                  <Ionicons name="cash-outline" size={19} color={colors.primary} />
                </View>
                <View>
                  <Text className="font-sans-semibold text-base text-primary">Default Currency</Text>
                  <Text className="font-sans-medium text-xs text-muted-foreground">
                    Display format for bills
                  </Text>
                </View>
              </View>
              <Text className="font-sans-bold text-sm text-primary">USD ($)</Text>
            </View>

            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="size-10 rounded-2xl bg-primary/10 items-center justify-center">
                  <Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} />
                </View>
                <View>
                  <Text className="font-sans-semibold text-base text-primary">Security & Biometrics</Text>
                  <Text className="font-sans-medium text-xs text-muted-foreground">
                    Face ID & device passcode
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </View>
          </View>
        </View>

        {/* Account & Session Management */}
        <View className="mb-6">
          <Text className="text-xs font-sans-bold uppercase tracking-wider text-muted-foreground px-1 mb-2.5">
            Account & Session
          </Text>

          <View className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
            <Pressable
              onPress={handleSignOut}
              disabled={signingOut}
              className="flex-row items-center justify-between p-4 active:bg-muted/40"
            >
              <View className="flex-row items-center gap-3.5 flex-1 mr-2">
                <View className="size-10 rounded-2xl bg-destructive/10 items-center justify-center">
                  <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
                </View>
                <View className="flex-1">
                  <Text className="font-sans-bold text-base text-destructive">
                    {signingOut ? "Logging out..." : "Log Out"}
                  </Text>
                  <Text className="font-sans-medium text-xs text-muted-foreground mt-0.5">
                    Sign out of this session on your device
                  </Text>
                </View>
              </View>
              {signingOut ? (
                <ActivityIndicator color={colors.destructive} size="small" />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              )}
            </Pressable>
          </View>
        </View>

        {/* App Meta & Brand Signature */}
        <View className="mt-4 items-center">
          <Text className="text-xs font-sans-bold text-primary/40 uppercase tracking-widest">
            Recurrly v1.0.0
          </Text>
          <Text className="text-[11px] font-sans-medium text-muted-foreground mt-1">
            Smart & Automated Subscription Tracker
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
