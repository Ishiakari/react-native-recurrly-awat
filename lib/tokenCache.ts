import { tokenCache as nativeTokenCache } from "@clerk/expo/token-cache";
import { Platform } from "react-native";

const webTokenCache = {
  getToken: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.error("Failed to get token from localStorage", error);
      return null;
    }
  },
  saveToken: async (key: string, token: string): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, token);
      }
    } catch (error) {
      console.error("Failed to save token to localStorage", error);
    }
  },
  clearToken: async (key: string): Promise<void> => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error("Failed to clear token from localStorage", error);
    }
  },
};

export const tokenCache = Platform.OS === "web" ? webTokenCache : nativeTokenCache;
