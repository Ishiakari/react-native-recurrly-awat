import { icons } from "@/app/constants/icons";
import clsx from "clsx";
import dayjs from "dayjs";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export const CATEGORIES = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

export type SubscriptionCategory = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<string, string> = {
  Entertainment: "#ffd7a8",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#f5c542",
  Productivity: "#c8e6c9",
  Cloud: "#bbdefb",
  Music: "#b8e8d0",
  Other: "#e2e8f0",
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || "#e2e8f0";
};

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (subscription: Subscription) => void;
}

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onSubmit,
}: CreateSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<"Monthly" | "Yearly">("Monthly");
  const [category, setCategory] =
    useState<SubscriptionCategory>("Entertainment");

  const trimmedName = name.trim();
  const trimmedPrice = price.trim();
  const isNumericPrice =
    trimmedPrice.length > 0 &&
    !isNaN(Number(trimmedPrice)) &&
    Number(trimmedPrice) > 0;
  const isValid = trimmedName.length > 0 && isNumericPrice;

  const handleClose = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
    onClose();
  };

  const handleSubmit = () => {
    if (!isValid) return;

    const parsedPrice = Number(trimmedPrice);
    const startDate = dayjs().toISOString();
    const renewalDate = dayjs()
      .add(1, frequency === "Yearly" ? "year" : "month")
      .toISOString();

    const newSubscription: Subscription = {
      id: `sub-${Date.now()}`,
      name: trimmedName,
      price: parsedPrice,
      billing: frequency,
      plan: `${frequency} Plan`,
      category,
      paymentMethod: "Credit Card",
      status: "active",
      startDate,
      renewalDate,
      icon: icons.wallet,
      currency: "USD",
      color: getCategoryColor(category),
    };

    onSubmit(newSubscription);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable className="modal-overlay justify-end" onPress={handleClose}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="modal-container max-h-[90%]"
          >
            {/* Modal Header */}
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable
                onPress={handleClose}
                hitSlop={10}
                className="modal-close"
              >
                <Text className="modal-close-text">✕</Text>
              </Pressable>
            </View>

            {/* Modal Form Body */}
            <ScrollView
              className="modal-body"
              contentContainerStyle={{ gap: 20, paddingBottom: 28 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Name Field */}
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Netflix, Spotify"
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  className="auth-input"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Price Field */}
              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  keyboardType="decimal-pad"
                  className="auth-input"
                />
              </View>

              {/* Frequency Toggle */}
              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  <Pressable
                    onPress={() => setFrequency("Monthly")}
                    className={clsx(
                      "picker-option",
                      frequency === "Monthly" && "picker-option-active"
                    )}
                  >
                    <Text
                      className={clsx(
                        "picker-option-text",
                        frequency === "Monthly" && "picker-option-text-active"
                      )}
                    >
                      Monthly
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setFrequency("Yearly")}
                    className={clsx(
                      "picker-option",
                      frequency === "Yearly" && "picker-option-active"
                    )}
                  >
                    <Text
                      className={clsx(
                        "picker-option-text",
                        frequency === "Yearly" && "picker-option-text-active"
                      )}
                    >
                      Yearly
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Category Chips */}
              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        className={clsx(
                          "category-chip",
                          isSelected && "category-chip-active"
                        )}
                      >
                        <Text
                          className={clsx(
                            "category-chip-text",
                            isSelected && "category-chip-text-active"
                          )}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Submit Button */}
              <Pressable
                disabled={!isValid}
                onPress={handleSubmit}
                className={clsx(
                  "auth-button mt-2",
                  !isValid && "auth-button-disabled"
                )}
              >
                <Text className="auth-button-text">Add Subscription</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

