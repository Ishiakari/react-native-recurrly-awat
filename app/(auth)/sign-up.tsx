import { colors } from "@/app/constants/theme";
import { useSignUp, useSignIn } from "@clerk/expo/legacy";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { signIn } = useSignIn();
  const router = useRouter();

  // Form input states
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verification step state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    code?: string;
  }>({});

  // Countdown timer for resend code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const validateSignUpForm = () => {
    const errors: typeof fieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!emailAddress.trim()) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(emailAddress.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignUp = async () => {
    if (!isLoaded || loading) return;
    setErrorMsg(null);

    if (!validateSignUpForm()) return;

    setLoading(true);

    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      await signUp.create({
        emailAddress: emailAddress.trim(),
        password,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setResendCooldown(30);
    } catch (err: any) {
      console.error("Sign up error:", err);
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Failed to create account. Please check the details and try again.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isLoaded || verifyLoading) return;
    setErrorMsg(null);

    if (!code.trim()) {
      setFieldErrors({ code: "Please enter the 6-digit verification code" });
      return;
    }

    setVerifyLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result.status === "complete") {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }
        router.replace("/(tabs)");
        return;
      }

      // Log unexpected status for debugging
      console.warn("Unexpected sign-up status:", JSON.stringify({
        status: result.status,
        missingFields: result.missingFields,
        unverifiedFields: result.unverifiedFields,
      }));

      setErrorMsg(
        result.missingFields?.length
          ? `Additional info required: ${result.missingFields.join(", ")}. Please contact support.`
          : "Verification incomplete. Please try again or contact support."
      );
    } catch (err: any) {
      console.error("Verification error:", JSON.stringify(err?.errors));

      const errCode = err?.errors?.[0]?.code || "";
      const errMsg = (err?.errors?.[0]?.message || "").toLowerCase();

      // If already verified, sign in directly
      if (
        errCode === "verification_already_verified" ||
        errMsg.includes("already") && errMsg.includes("verified")
      ) {
        try {
          const signInAttempt = await signIn.create({
            identifier: emailAddress.trim(),
            password,
          });
          if (signInAttempt.status === "complete" && signInAttempt.createdSessionId) {
            await setActive({ session: signInAttempt.createdSessionId });
            router.replace("/(tabs)");
            return;
          }
        } catch (signInErr: any) {
          console.error("Auto sign-in after verification failed:", signInErr?.errors);
          setErrorMsg("Your account was verified. Please sign in manually.");
          router.replace("/(auth)/sign-in");
          return;
        }
      }

      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid verification code. Please check and try again.";
      setErrorMsg(message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || resendCooldown > 0) return;
    setErrorMsg(null);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendCooldown(30);
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Unable to resend code right now. Please wait a moment.";
      setErrorMsg(message);
    }
  };

  // Password rules helper
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

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
                {pendingVerification ? "Verify your email" : "Create an account"}
              </Text>
              <Text className="auth-subtitle">
                {pendingVerification
                  ? `Enter the 6-digit verification code sent to ${emailAddress.trim()}`
                  : "Sign up to start tracking and optimizing your subscriptions"}
              </Text>
            </View>

            {/* Error Banner */}
            {errorMsg && (
              <View className="mt-6 flex-row items-center gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
                <Ionicons name="alert-circle" size={20} color={colors.destructive} />
                <Text className="flex-1 font-sans-medium text-sm text-destructive leading-5">
                  {errorMsg}
                </Text>
              </View>
            )}

            {/* Main Form Card */}
            <View className="auth-card shadow-sm">
              {!pendingVerification ? (
                /* Step 1: Sign Up Form */
                <View className="auth-form">
                  {/* Full Name */}
                  <View className="auth-field">
                    <Text className="auth-label">Full Name</Text>
                    <TextInput
                      className={`auth-input ${
                        fieldErrors.fullName ? "auth-input-error" : ""
                      }`}
                      placeholder="Enter your full name"
                      placeholderTextColor="rgba(8, 17, 38, 0.35)"
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        if (fieldErrors.fullName) {
                          setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                        }
                      }}
                      autoCapitalize="words"
                      autoCorrect={false}
                      editable={!loading}
                    />
                    {fieldErrors.fullName && (
                      <Text className="auth-error">{fieldErrors.fullName}</Text>
                    )}
                  </View>

                  {/* Email */}
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

                  {/* Password */}
                  <View className="auth-field">
                    <Text className="auth-label">Password</Text>
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

                    {/* Password Strength Checklist */}
                    {password.length > 0 && (
                      <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
                        <View className="flex-row items-center gap-1">
                          <Ionicons
                            name={hasMinLength ? "checkmark-circle" : "ellipse-outline"}
                            size={14}
                            color={hasMinLength ? colors.success : colors.mutedForeground}
                          />
                          <Text
                            className={`text-xs font-sans-medium ${
                              hasMinLength ? "text-success" : "text-muted-foreground"
                            }`}
                          >
                            8+ characters
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Ionicons
                            name={hasLetter ? "checkmark-circle" : "ellipse-outline"}
                            size={14}
                            color={hasLetter ? colors.success : colors.mutedForeground}
                          />
                          <Text
                            className={`text-xs font-sans-medium ${
                              hasLetter ? "text-success" : "text-muted-foreground"
                            }`}
                          >
                            Letters
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Ionicons
                            name={hasNumber ? "checkmark-circle" : "ellipse-outline"}
                            size={14}
                            color={hasNumber ? colors.success : colors.mutedForeground}
                          />
                          <Text
                            className={`text-xs font-sans-medium ${
                              hasNumber ? "text-success" : "text-muted-foreground"
                            }`}
                          >
                            Numbers
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Confirm Password */}
                  <View className="auth-field">
                    <Text className="auth-label">Confirm Password</Text>
                    <TextInput
                      className={`auth-input ${
                        fieldErrors.confirmPassword ? "auth-input-error" : ""
                      }`}
                      placeholder="Re-enter your password"
                      placeholderTextColor="rgba(8, 17, 38, 0.35)"
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (fieldErrors.confirmPassword) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            confirmPassword: undefined,
                          }));
                        }
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                    {fieldErrors.confirmPassword && (
                      <Text className="auth-error">{fieldErrors.confirmPassword}</Text>
                    )}
                  </View>

                  {/* Submit Button */}
                  <Pressable
                    onPress={handleSignUp}
                    disabled={loading || !isLoaded}
                    className={`auth-button shadow-sm active:opacity-90 ${
                      loading ? "auth-button-disabled" : ""
                    }`}
                  >
                    {loading ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator color="#ffffff" size="small" />
                        <Text className="auth-button-text">Creating account...</Text>
                      </View>
                    ) : (
                      <Text className="auth-button-text">Create account</Text>
                    )}
                  </Pressable>
                </View>
              ) : (
                /* Step 2: Verification Code Form */
                <View className="auth-form">
                  <View className="items-center py-2">
                    <View className="size-14 items-center justify-center rounded-2xl bg-accent/15 mb-2">
                      <Ionicons name="mail-open" size={28} color={colors.accent} />
                    </View>
                    <Text className="font-sans-bold text-base text-primary">
                      Check your inbox
                    </Text>
                  </View>

                  <View className="auth-field">
                    <Text className="auth-label">Verification Code</Text>
                    <TextInput
                      className={`auth-input tracking-widest text-2xl font-sans-bold ${
                        fieldErrors.code ? "auth-input-error" : ""
                      }`}
                      style={{ textAlign: "center" }}
                      placeholder="000000"
                      placeholderTextColor="rgba(8, 17, 38, 0.35)"
                      value={code}
                      onChangeText={(text) => {
                        setCode(text);
                        if (fieldErrors.code) {
                          setFieldErrors((prev) => ({ ...prev, code: undefined }));
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                      editable={!verifyLoading}
                    />
                    {fieldErrors.code && (
                      <Text className="auth-error text-center">{fieldErrors.code}</Text>
                    )}
                  </View>

                  <Pressable
                    onPress={handleVerifyCode}
                    disabled={verifyLoading || !isLoaded}
                    className={`auth-button shadow-sm active:opacity-90 ${
                      verifyLoading ? "auth-button-disabled" : ""
                    }`}
                  >
                    {verifyLoading ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator color="#ffffff" size="small" />
                        <Text className="auth-button-text">Verifying code...</Text>
                      </View>
                    ) : (
                      <Text className="auth-button-text">Verify & continue</Text>
                    )}
                  </Pressable>

                  {/* Resend Code & Back Buttons */}
                  <View className="mt-2 flex-row items-center justify-between">
                    <Pressable
                      onPress={handleResendCode}
                      disabled={resendCooldown > 0}
                      className="py-2"
                      hitSlop={8}
                    >
                      <Text
                        className={`font-sans-semibold text-xs ${
                          resendCooldown > 0 ? "text-muted-foreground" : "text-accent"
                        }`}
                      >
                        {resendCooldown > 0
                          ? `Resend code in ${resendCooldown}s`
                          : "Resend Code"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setPendingVerification(false);
                        setCode("");
                        setErrorMsg(null);
                      }}
                      className="py-2"
                      hitSlop={8}
                    >
                      <Text className="font-sans-semibold text-xs text-primary">
                        Change Email
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Bottom Switch Link */}
            {!pendingVerification && (
              <View className="auth-link-row">
                <Text className="auth-link-copy">Already have an account?</Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Pressable hitSlop={8}>
                    <Text className="auth-link">Sign in</Text>
                  </Pressable>
                </Link>
              </View>
            )}

            {/* Terms and Privacy notice */}
            <View className="mt-8 items-center px-4">
              <Text className="text-center font-sans-medium text-xs text-muted-foreground leading-4">
                By creating an account, you agree to Recurrly’s Terms of Service and Privacy Policy.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
