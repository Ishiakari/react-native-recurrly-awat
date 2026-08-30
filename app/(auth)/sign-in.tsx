import { colors } from "@/app/constants/theme";
import { formatCurrency } from "@/lib/utils";
import { useSignIn } from "@clerk/expo/legacy";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Forgot password flow state
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailAddress.trim()) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(emailAddress.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async () => {
    if (!isLoaded || loading) return;
    setErrorMsg(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: emailAddress.trim(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        // Fallback for multi-factor or secondary steps if configured
        console.log("Sign-in requires additional verification:", result.status);
        setErrorMsg("Additional verification required. Please check your email.");
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Unable to sign in. Please verify your credentials and try again.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!isLoaded || resetLoading) return;
    setErrorMsg(null);

    if (!emailAddress.trim()) {
      setFieldErrors({ email: "Enter your email address to reset password" });
      return;
    }

    setResetLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: emailAddress.trim(),
      });
      setResetCodeSent(true);
      setResetSuccessMsg(`We sent a password reset code to ${emailAddress.trim()}`);
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Unable to send reset code. Please ensure the email is registered.";
      setErrorMsg(message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleCompletePasswordReset = async () => {
    if (!isLoaded || resetLoading) return;
    setErrorMsg(null);

    if (!resetCode.trim()) {
      setErrorMsg("Please enter the reset code you received");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters");
      return;
    }

    setResetLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode.trim(),
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else {
        setErrorMsg("Password reset incomplete. Please try again.");
      }
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Failed to reset password. Please check the code and try again.";
      setErrorMsg(message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView className="auth-safe-area" style={{ flex: 1, backgroundColor: "#fff9e3" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "#fff9e3" }}
      >
        <ScrollView
          className="auth-scroll"
          style={{ flex: 1, backgroundColor: "#fff9e3" }}
          contentContainerStyle={{ flexGrow: 1, backgroundColor: "#fff9e3" }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="auth-content">
            {/* Brand Logo & Header */}
            <View className="auth-brand-block">
              <View className="auth-logo-wrap">
                <View className="auth-logo-mark shadow-sm">
                  <Text className="auth-logo-mark-text">R</Text>
                </View>
                <View>
                  <Text className="auth-wordmark">Recurrly</Text>
                  <Text className="auth-wordmark-sub">SMART BILLING</Text>
                </View>
              </View>

              <Text className="auth-title">
                {isResettingPassword ? "Reset password" : "Welcome back"}
              </Text>
              <Text className="auth-subtitle">
                {isResettingPassword
                  ? resetCodeSent
                    ? "Enter the code sent to your email to set a new password"
                    : "Enter your account email and we'll send you recovery instructions"
                  : "Sign in to continue managing your subscriptions"}
              </Text>
            </View>

            {/* Error Message Banner */}
            {errorMsg && (
              <View className="mt-6 flex-row items-center gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
                <Ionicons name="alert-circle" size={20} color={colors.destructive} />
                <Text className="flex-1 font-sans-medium text-sm text-destructive leading-5">
                  {errorMsg}
                </Text>
              </View>
            )}

            {/* Success Message Banner */}
            {resetSuccessMsg && (
              <View className="mt-6 flex-row items-center gap-2.5 rounded-2xl border border-success/30 bg-success/10 p-4">
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text className="flex-1 font-sans-medium text-sm text-success leading-5">
                  {resetSuccessMsg}
                </Text>
              </View>
            )}

            {/* Form Card */}
            <View className="auth-card shadow-sm">
              {!isResettingPassword ? (
                /* Standard Sign In Form */
                <View className="auth-form">
                  {/* Email Field */}
                  <View className="auth-field">
                    <Text className="auth-label">Email</Text>
                    <View className="relative justify-center">
                      <TextInput
                        className={`auth-input pr-10 ${
                          fieldErrors.email ? "auth-input-error" : ""
                        }`}
                        placeholder="Enter your email"
                        placeholderTextColor="rgba(8, 17, 38, 0.35)"
                        value={emailAddress}
                        onChangeText={(text) => {
                          setEmailAddress(text);
                          if (fieldErrors.email) {
                            setFieldErrors((prev) => ({ ...prev, email: undefined }));
                          }
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                        autoCorrect={false}
                        editable={!loading}
                      />
                      <View className="absolute right-4 pointer-events-none">
                        <Ionicons
                          name="mail-outline"
                          size={18}
                          color={colors.mutedForeground}
                        />
                      </View>
                    </View>
                    {fieldErrors.email && (
                      <Text className="auth-error">{fieldErrors.email}</Text>
                    )}
                  </View>

                  {/* Password Field */}
                  <View className="auth-field">
                    <View className="flex-row items-center justify-between">
                      <Text className="auth-label">Password</Text>
                      <Pressable
                        onPress={() => {
                          setIsResettingPassword(true);
                          setErrorMsg(null);
                        }}
                        hitSlop={8}
                      >
                        <Text className="font-sans-semibold text-xs text-accent">
                          Forgot Password?
                        </Text>
                      </Pressable>
                    </View>

                    <View className="relative justify-center">
                      <TextInput
                        className={`auth-input pr-12 ${
                          fieldErrors.password ? "auth-input-error" : ""
                        }`}
                        placeholder="Enter your password"
                        placeholderTextColor="rgba(8, 17, 38, 0.35)"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (fieldErrors.password) {
                            setFieldErrors((prev) => ({ ...prev, password: undefined }));
                          }
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                      />
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        className="absolute right-4 p-1"
                        hitSlop={8}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={colors.mutedForeground}
                        />
                      </Pressable>
                    </View>
                    {fieldErrors.password && (
                      <Text className="auth-error">{fieldErrors.password}</Text>
                    )}
                  </View>

                  {/* Submit Button */}
                  <Pressable
                    onPress={handleSignIn}
                    disabled={loading || !isLoaded}
                    className={`auth-button shadow-sm active:opacity-90 ${
                      loading ? "auth-button-disabled" : ""
                    }`}
                  >
                    {loading ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator color="#ffffff" size="small" />
                        <Text className="auth-button-text">Signing in...</Text>
                      </View>
                    ) : (
                      <Text className="auth-button-text">Sign in</Text>
                    )}
                  </Pressable>
                </View>
              ) : (
                /* Password Reset Flow */
                <View className="auth-form">
                  {!resetCodeSent ? (
                    <>
                      <View className="auth-field">
                        <Text className="auth-label">Registered Email</Text>
                        <TextInput
                          className={`auth-input ${
                            fieldErrors.email ? "auth-input-error" : ""
                          }`}
                          placeholder="Enter your email"
                          placeholderTextColor="rgba(8, 17, 38, 0.35)"
                          value={emailAddress}
                          onChangeText={setEmailAddress}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          editable={!resetLoading}
                        />
                        {fieldErrors.email && (
                          <Text className="auth-error">{fieldErrors.email}</Text>
                        )}
                      </View>

                      <Pressable
                        onPress={handleRequestPasswordReset}
                        disabled={resetLoading}
                        className={`auth-button active:opacity-90 ${
                          resetLoading ? "auth-button-disabled" : ""
                        }`}
                      >
                        {resetLoading ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text className="auth-button-text">Send recovery code</Text>
                        )}
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <View className="auth-field">
                        <Text className="auth-label">6-Digit Recovery Code</Text>
                        <TextInput
                          className="auth-input tracking-widest text-xl font-sans-bold"
                          style={{ textAlign: "center" }}
                          placeholder="000000"
                          placeholderTextColor="rgba(8, 17, 38, 0.35)"
                          value={resetCode}
                          onChangeText={setResetCode}
                          keyboardType="number-pad"
                          maxLength={6}
                          editable={!resetLoading}
                        />
                      </View>

                      <View className="auth-field">
                        <Text className="auth-label">New Password</Text>
                        <TextInput
                          className="auth-input"
                          placeholder="At least 8 characters"
                          placeholderTextColor="rgba(8, 17, 38, 0.35)"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry
                          autoCapitalize="none"
                          editable={!resetLoading}
                        />
                      </View>

                      <Pressable
                        onPress={handleCompletePasswordReset}
                        disabled={resetLoading}
                        className={`auth-button active:opacity-90 ${
                          resetLoading ? "auth-button-disabled" : ""
                        }`}
                      >
                        {resetLoading ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text className="auth-button-text">Update password & sign in</Text>
                        )}
                      </Pressable>
                    </>
                  )}

                  <Pressable
                    onPress={() => {
                      setIsResettingPassword(false);
                      setResetCodeSent(false);
                      setErrorMsg(null);
                      setResetSuccessMsg(null);
                    }}
                    className="items-center py-2"
                  >
                    <Text className="font-sans-semibold text-sm text-primary">
                      Back to Sign In
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Bottom Navigation Link */}
            {!isResettingPassword && (
              <View className="auth-link-row">
                <Text className="auth-link-copy">New to Recurrly?</Text>
                <Link href="/(auth)/sign-up" asChild>
                  <Pressable hitSlop={8}>
                    <Text className="auth-link">Create an account</Text>
                  </Pressable>
                </Link>
              </View>
            )}

            {/* Trust Footer */}
            <View className="mt-12 items-center flex-row justify-center gap-1.5 opacity-60">
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              <Text className="font-sans-medium text-xs text-primary">
                Encrypted & Secure Subscription Tracking
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
