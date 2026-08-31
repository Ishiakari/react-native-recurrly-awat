import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscriptions } from "@/context/SubscriptionsContext";
import { posthog } from "@/lib/posthog";
import { Feather, Ionicons } from "@expo/vector-icons";
import { styled } from "nativewind";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text as RNText,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
const Text = styled(RNText);

const Subscriptions = () => {
  const { subscriptions } = useSubscriptions();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Extract unique categories and filter options
  const filterOptions = useMemo(() => {
    const categories = Array.from(
      new Set(subscriptions.map((item) => item.category).filter(Boolean))
    ) as string[];

    return [
      { id: "all", label: "All" },
      ...categories.map((cat) => ({ id: cat.toLowerCase(), label: cat })),
      { id: "active", label: "Active" },
      { id: "paused", label: "Paused" },
      { id: "cancelled", label: "Cancelled" },
    ];
  }, [subscriptions]);

  // Filter subscriptions by search query & selected filter
  const filteredSubscriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return subscriptions.filter((item) => {
      // Search matching (name, plan, category, billing, paymentMethod, status)
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.plan?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.billing?.toLowerCase().includes(query) ||
        item.status?.toLowerCase().includes(query) ||
        item.paymentMethod?.toLowerCase().includes(query);

      if (!matchesQuery) return false;

      // Filter matching
      if (selectedFilter === "all") return true;
      if (
        selectedFilter === "active" ||
        selectedFilter === "paused" ||
        selectedFilter === "cancelled"
      ) {
        return item.status?.toLowerCase() === selectedFilter;
      }

      return item.category?.toLowerCase() === selectedFilter;
    });
  }, [searchQuery, selectedFilter]);

  const handleCardPress = (item: Subscription) => {
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
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Fixed Search & Filter Header (Keeps TextInput mounted & focused) */}
      <View className="px-5 pt-3 pb-2">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-3xl font-sans-bold text-primary">
            Subscriptions
          </Text>
          <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
            Manage and track all your recurring subscriptions
          </Text>
        </View>

        {/* Search Input */}
        <View className="mb-3 flex-row items-center rounded-2xl border border-border bg-card px-4 py-3">
          <Feather
            name="search"
            size={20}
            color="#081126"
            style={{ opacity: 0.6 }}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, plan, category..."
            placeholderTextColor="rgba(0, 0, 0, 0.4)"
            className="ml-3 flex-1 font-sans-medium text-base text-primary"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              hitSlop={10}
              className="rounded-full bg-muted p-1"
            >
              <Ionicons name="close" size={16} color="#081126" />
            </Pressable>
          )}
        </View>

        {/* Filter Chips */}
        <View className="mb-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 8, paddingRight: 8, paddingVertical: 2 }}
          >
            {filterOptions.map((filter) => {
              const isSelected = selectedFilter === filter.id;
              return (
                <Pressable
                  key={filter.id}
                  onPress={() => setSelectedFilter(filter.id)}
                  className={`rounded-full px-4 py-2 border ${
                    isSelected
                      ? "bg-accent border-accent"
                      : "bg-card border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-sans-semibold ${
                      isSelected ? "text-white" : "text-primary"
                    }`}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Results Count & Reset */}
        <View className="flex-row items-center justify-between pt-1 pb-1">
          <Text className="text-sm font-sans-semibold text-muted-foreground">
            {filteredSubscriptions.length}{" "}
            {filteredSubscriptions.length === 1
              ? "subscription"
              : "subscriptions"}
          </Text>
          {(searchQuery || selectedFilter !== "all") && (
            <Pressable
              onPress={() => {
                setSearchQuery("");
                setSelectedFilter("all");
              }}
              hitSlop={8}
            >
              <Text className="text-xs font-sans-bold text-accent">
                Reset filters
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Subscription List */}
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="px-5">
            <SubscriptionCard
              {...item}
              expanded={expandedId === item.id}
              onPress={() => handleCardPress(item)}
            />
          </View>
        )}
        extraData={expandedId}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ItemSeparatorComponent={() => <View className="h-3.5" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 140 }}
        ListEmptyComponent={
          <View className="mt-8 items-center justify-center px-8 py-8">
            <View className="mb-4 size-16 items-center justify-center rounded-full bg-muted">
              <Feather name="search" size={28} color="#ea7a53" />
            </View>
            <Text className="text-center text-lg font-sans-bold text-primary">
              No subscriptions found
            </Text>
            <Text className="mt-2 text-center text-sm font-sans-medium leading-relaxed text-muted-foreground">
              {searchQuery
                ? `No matching results for "${searchQuery}". Try searching with a different keyword.`
                : "No subscriptions match the selected filter."}
            </Text>
            {(searchQuery || selectedFilter !== "all") && (
              <Pressable
                onPress={() => {
                  setSearchQuery("");
                  setSelectedFilter("all");
                }}
                className="mt-6 rounded-2xl bg-accent px-6 py-3"
              >
                <Text className="font-sans-bold text-white">Clear search</Text>
              </Pressable>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Subscriptions;

