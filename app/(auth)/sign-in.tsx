import { colors } from "@/app/constants/theme";
import { posthog } from "@/lib/posthog";
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
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    mfaCode?: string;
  }>({});

  // Forgot password flow state
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // MFA second-factor flow state
  const [isMfaRequired, setIsMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaStrategy, setMfaStrategy] = useState<string>("phone_code");
  const [mfaLoading, setMfaLoading] = useState(false);

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
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      setErrorMsg(firstError || "Please check your inputs and try again.");
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!isLoaded) {
      setErrorMsg("Authentication is still initializing. Please wait a moment.");
      return;
    }
    if (loading) return;
    setErrorMsg(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: emailAddress.trim(),
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        posthog?.capture("user_signed_in", { authentication_method: "password" });
      } else if (result.status === "needs_second_factor") {
        const secondFactor =
          result.supportedSecondFactors?.find(
            (factor) => factor.strategy === "phone_code" || factor.strategy === "email_code"
          ) || result.supportedSecondFactors?.[0];

        const strategy = (secondFactor?.strategy || "phone_code") as any;
        setMfaStrategy(strategy);

        if (strategy === "phone_code" || strategy === "email_code") {
          await signIn.prepareSecondFactor({ strategy });
        }

        setIsMfaRequired(true);
      } else {
        // Fallback for unsupported or incomplete steps
        console.log("Sign-in requires additional verification:", result.status);
        setErrorMsg("Additional verification required. Please check your account.");
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

  const handleVerifyMfa = async () => {
    if (!isLoaded) {
      setErrorMsg("Authentication is still initializing. Please wait a moment.");
      return;
    }
    if (mfaLoading) return;
    setErrorMsg(null);

    if (!mfaCode.trim()) {
      setFieldErrors({ mfaCode: "Please enter the verification code" });
      return;
    }

    setMfaLoading(true);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: mfaStrategy as any,
        code: mfaCode.trim(),
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        posthog?.capture("user_signed_in", { authentication_method: "mfa" });
      } else {
        setErrorMsg(`Verification incomplete. Status: ${result.status}`);
      }
    } catch (err: any) {
      console.error("MFA verification error:", err);
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid verification code. Please check and try again.";
      setErrorMsg(message);
    } finally {
      setMfaLoading(false);
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
      posthog?.capture("password_reset_requested");
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

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        posthog?.capture("password_reset_completed");
        posthog?.capture("user_signed_in", { authentication_method: "password_reset" });
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
                {isResettingPassword
                  ? "Reset password"
                  : isMfaRequired
                  ? "Two-factor check"
                  : "Welcome back"}
              </Text>
              <Text className="auth-subtitle">
                {isResettingPassword
                  ? resetCodeSent
                    ? "Enter the code sent to your email to set a new password"
                    : "Enter your account email and we'll send you recovery instructions"
                  : isMfaRequired
                  ? "Enter the security code to complete sign in"
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
              {isMfaRequired ? (
                /* Two-Factor Authentication Form */
                <View className="auth-form">
                  <View className="items-center py-2">
                    <View className="size-14 items-center justify-center rounded-2xl bg-accent/15 mb-2">
                      <Ionicons name="key" size={26} color={colors.accent} />
                    </View>
                    <Text className="font-sans-bold text-base text-primary">
                      Two-Factor Verification
                    </Text>
                  </View>

                  <View className="auth-field">
                    <Text className="auth-label">Security Code</Text>
                    <TextInput
                      className={`auth-input tracking-widest text-2xl font-sans-bold ${
                        fieldErrors.mfaCode ? "auth-input-error" : ""
                      }`}
                      style={{ textAlign: "center" }}
                      placeholder="000000"
                      placeholderTextColor="rgba(8, 17, 38, 0.35)"
                      value={mfaCode}
                      onChangeText={(text) => {
                        setMfaCode(text);
                        if (fieldErrors.mfaCode) {
                          setFieldErrors((prev) => ({ ...prev, mfaCode: undefined }));
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                      editable={!mfaLoading}
                    />
                    {fieldErrors.mfaCode && (
                      <Text className="auth-error text-center">{fieldErrors.mfaCode}</Text>
                    )}
                  </View>

                  <Pressable
                    onPress={handleVerifyMfa}
                    disabled={mfaLoading}
                    className={`auth-button shadow-sm active:opacity-90 ${
                      mfaLoading ? "auth-button-disabled" : ""
                    }`}
                  >
                    {mfaLoading ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator color="#ffffff" size="small" />
                        <Text className="auth-button-text">Verifying code...</Text>
                      </View>
                    ) : (
                      <Text className="auth-button-text">Verify & sign in</Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setIsMfaRequired(false);
                      setMfaCode("");
                      setErrorMsg(null);
                    }}
                    className="items-center py-2"
                  >
                    <Text className="font-sans-semibold text-sm text-primary">
                      Back to Sign In
                    </Text>
                  </Pressable>
                </View>
              ) : !isResettingPassword ? (
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
                    disabled={loading}
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
            {!isResettingPassword && !isMfaRequired && (
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
