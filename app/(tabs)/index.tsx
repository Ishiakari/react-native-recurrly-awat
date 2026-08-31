import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import ListHeading from "@/components/ListHeading";
import SubscriptionCard from "@/components/SubscriptionCard";
import UpcomingSubscription from "@/components/UpcomingSubscription";
import { useSubscriptions } from "@/context/SubscriptionsContext";
import { posthog } from "@/lib/posthog";
import { formatCurrency, getUserDisplayName } from "@/lib/utils";
import dayjs from "dayjs";
import { styled } from "nativewind";
import { useUser } from "@clerk/expo";
import React, { useState } from "react";
import {
  FlatList,
  Image as RNImage,
  Pressable,
  Text as RNText,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import {
  HOME_BALANCE,
  HOME_USER,
  UPCOMING_SUBSCRIPTIONS,
} from "../constants/data";
import { icons } from "../constants/icons";
import images from "../constants/images";

const SafeAreaView = styled(RNSafeAreaView);
const Image = styled(RNImage);
const Text = styled(RNText);

export default function App() {
  const { user } = useUser();
  const { subscriptions, addSubscription } = useSubscriptions();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const displayName = getUserDisplayName(user, HOME_USER.name);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        ListHeaderComponent={() => (
          <>
            <View className="home-header">
              <View className="home-user">
                <Image
                  source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
                  className="home-avatar"
                />
                <Text className="home-user-name">{displayName}</Text>
              </View>
              <Pressable
                onPress={() => setIsModalVisible(true)}
                hitSlop={8}
              >
                <Image source={icons.add} className="home-add-icon" />
              </Pressable>
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>
              <View className="home-balance-row">
                <Text className="home-balance-amount">
                  {formatCurrency(HOME_BALANCE.amount)}
                </Text>
                <Text className="home-balance-date">
                  {dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}
                </Text>
              </View>
            </View>

            <View className="mb-5">
              <ListHeading title="Upcoming" />

              <FlatList
                data={UPCOMING_SUBSCRIPTIONS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <UpcomingSubscription {...item} />}
                ListEmptyComponent={
                  <Text className="home-empty-state">
                    No upcoming renewals yet.
                  </Text>
                }
              />
            </View>

            <ListHeading title="All Subscriptions" />
          </>
        )}
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedId === item.id}
            onPress={() => {
              const isExpanding = expandedId !== item.id;
              setExpandedId(isExpanding ? item.id : null);

              if (isExpanding) {
                posthog?.capture("subscription_details_expanded", {
                  subscription_id: item.id,
                  ...(item.category ? { category: item.category } : {}),
                  ...(item.billing ? { billing_interval: item.billing } : {}),
                  ...(item.status ? { status: item.status } : {}),
                });
              }
            }}
          />
        )}
        extraData={expandedId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="home-empty-state">No subscriptions yet.</Text>
        }
        contentContainerClassName="pb-30"
      />

      <CreateSubscriptionModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={(newSub) => {
          addSubscription(newSub);
        }}
      />
    </SafeAreaView>
  );
}
