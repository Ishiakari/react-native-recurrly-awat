import { colors } from "@/app/constants/theme";
import images from "@/app/constants/images";
import { useAuth, useUser } from "@clerk/expo";
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
  const [signingOut, setSigningOut] = useState(false);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : "Recurrly Member";
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "No email linked";

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of Recurrly?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
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
    <SafeAreaView className="flex-1 bg-background p-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-sans-bold text-primary">Settings</Text>
          <Text className="text-sm font-sans-medium text-muted-foreground mt-1">
            Manage your account and app preferences
          </Text>
        </View>

        {/* Profile Card */}
        <View className="rounded-3xl border border-border bg-card p-5 mb-6 shadow-sm">
          <View className="flex-row items-center gap-4">
            <Image
              source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
              className="size-16 rounded-full"
            />
            <View className="flex-1">
              <Text className="text-xl font-sans-bold text-primary">{displayName}</Text>
              <Text className="text-sm font-sans-medium text-muted-foreground mt-0.5" numberOfLines={1}>
                {userEmail}
              </Text>
              <View className="mt-2 flex-row items-center gap-1.5 bg-success/15 px-2.5 py-0.5 rounded-full self-start">
                <View className="size-1.5 rounded-full bg-success" />
                <Text className="text-xs font-sans-semibold text-success">Active Account</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View className="gap-3 mb-6">
          <Text className="text-xs font-sans-bold uppercase tracking-wider text-muted-foreground px-1">
            Preferences
          </Text>

          <View className="rounded-2xl border border-border bg-card overflow-hidden">
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center gap-3">
                <View className="size-9 rounded-xl bg-accent/15 items-center justify-center">
                  <Ionicons name="notifications-outline" size={18} color={colors.accent} />
                </View>
                <Text className="font-sans-semibold text-base text-primary">Renewal Alerts</Text>
              </View>
              <Text className="font-sans-medium text-sm text-accent">Enabled</Text>
            </View>

            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <View className="flex-row items-center gap-3">
                <View className="size-9 rounded-xl bg-primary/10 items-center justify-center">
                  <Ionicons name="cash-outline" size={18} color={colors.primary} />
                </View>
                <Text className="font-sans-semibold text-base text-primary">Default Currency</Text>
              </View>
              <Text className="font-sans-medium text-sm text-muted-foreground">USD ($)</Text>
            </View>

            <View className="flex-row items-center justify-between p-4">
              <View className="flex-row items-center gap-3">
                <View className="size-9 rounded-xl bg-primary/10 items-center justify-center">
                  <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
                </View>
                <Text className="font-sans-semibold text-base text-primary">Security & Biometrics</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View className="gap-3">
          <Text className="text-xs font-sans-bold uppercase tracking-wider text-muted-foreground px-1">
            Account
          </Text>

          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            className="flex-row items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/10 p-4 active:opacity-80"
          >
            <View className="flex-row items-center gap-3">
              <View className="size-9 rounded-xl bg-destructive/20 items-center justify-center">
                <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
              </View>
              <Text className="font-sans-bold text-base text-destructive">
                {signingOut ? "Signing out..." : "Sign Out"}
              </Text>
            </View>
            {signingOut && <ActivityIndicator color={colors.destructive} size="small" />}
          </Pressable>
        </View>

        {/* App Version Info */}
        <View className="mt-10 items-center">
          <Text className="text-xs font-sans-medium text-muted-foreground">
            Recurrly v1.0.0 (Production)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
