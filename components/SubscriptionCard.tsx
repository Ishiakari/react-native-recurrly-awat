import {
  formatCurrency,
  formatStatusLabel,
  formatSubscriptionDateTime,
} from "@/lib/utils";
import clsx from "clsx";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";

const SubscriptionCard = ({
  name,
  price,
  currency,
  icon,
  billing,
  color,
  category,
  plan,
  renewalDate,
  expanded,
  onPress,
  paymentMethod,
  startDate,
  status,
}: SubscriptionCardProps) => {
  return (
    <Pressable
      onPress={onPress}
      className={clsx("sub-card", expanded ? "sub-card-expanded" : "bg-card")}
      style={!expanded && color ? { backgroundColor: color } : undefined}
    >
      <View className="sub-head">
        <View className="sub-main">
          <Image source={icon} className="sub-icon" />
          <View className="sub-copy">
            <Text numberOfLines={1} className="sub-title">
              {name}
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail" className="sub-meta">
              {category?.trim() ||
                plan?.trim() ||
                (renewalDate ? formatSubscriptionDateTime(renewalDate) : "")}
            </Text>
          </View>
        </View>

        <View className="sub-price-box">
          <Text className="sub-price">{formatCurrency(price, currency)}</Text>
          <Text className="sub-billing">{billing}</Text>
        </View>
      </View>

      {expanded && (
        <View className="mt-4 pt-4 border-t border-black/10 gap-3">
          <View className="gap-3">
            <View className="flex-row items-center justify-between gap-4">
              <Text className="shrink-0 text-sm font-sans-medium text-muted-foreground">
                Payment:
              </Text>
              <Text
                className="flex-1 text-right text-sm font-sans-bold text-primary"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {paymentMethod?.trim() ?? "Not provided"}
              </Text>
            </View>

            <View className="flex-row items-center justify-between gap-4">
              <Text className="shrink-0 text-sm font-sans-medium text-muted-foreground">
                Category:
              </Text>
              <Text
                className="flex-1 text-right text-sm font-sans-bold text-primary"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {(category?.trim() || plan?.trim()) ?? "Not provided"}
              </Text>
            </View>

            <View className="flex-row items-center justify-between gap-4">
              <Text className="shrink-0 text-sm font-sans-medium text-muted-foreground">
                Started:
              </Text>
              <Text
                className="flex-1 text-right text-sm font-sans-bold text-primary"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {startDate
                  ? formatSubscriptionDateTime(startDate)
                  : "Not provided"}
              </Text>
            </View>

            <View className="flex-row items-center justify-between gap-4">
              <Text className="shrink-0 text-sm font-sans-medium text-muted-foreground">
                Renewal date:
              </Text>
              <Text
                className="flex-1 text-right text-sm font-sans-bold text-primary"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {renewalDate
                  ? formatSubscriptionDateTime(renewalDate)
                  : "Not provided"}
              </Text>
            </View>

            <View className="flex-row items-center justify-between gap-4">
              <Text className="shrink-0 text-sm font-sans-medium text-muted-foreground">
                Status:
              </Text>
              <Text
                className="flex-1 text-right text-sm font-sans-bold text-primary"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {status ? formatStatusLabel(status) : "Not provided"}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
};
export default SubscriptionCard;
