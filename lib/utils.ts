import dayjs from "dayjs";

export const formatCurrency = (value: number, currency = "USD"): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
};

export const formatSubscriptionDateTime = (value?: string): string => {
  if (!value) return "Not provided";
  const parsedDate = dayjs(value);
  return parsedDate.isValid()
    ? parsedDate.format("MM/DD/YYYY")
    : "Not provided";
};  

export const formatStatusLabel = (value?: string): string => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const getUserDisplayName = (
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    emailAddresses?: Array<{ emailAddress: string }>;
  } | null,
  fallback = "Recurrly Member"
): string => {
  if (user?.firstName) {
    return `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`;
  }
  return user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || fallback;
};
