import React, { createContext, useContext, useState } from "react";
import { HOME_SUBSCRIPTIONS } from "../app/constants/data";

interface SubscriptionsContextType {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => void;
  setSubscriptions: React.Dispatch<React.SetStateAction<Subscription[]>>;
}

const SubscriptionsContext = createContext<SubscriptionsContextType | undefined>(
  undefined
);

export function SubscriptionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(HOME_SUBSCRIPTIONS);

  const addSubscription = (newSub: Subscription) => {
    setSubscriptions((prev) => [newSub, ...prev]);
  };

  return (
    <SubscriptionsContext.Provider
      value={{ subscriptions, addSubscription, setSubscriptions }}
    >
      {children}
    </SubscriptionsContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionsContext);
  if (!context) {
    throw new Error(
      "useSubscriptions must be used within a SubscriptionsProvider"
    );
  }
  return context;
}
