/**
 * Theme Controller
 *
 * Manages theme configuration from external-page.json
 * and provides theme data to UI components via base.ts
 * No Vuetify dependency - pure theme data management
 */

import axios from "axios";
import { ref, computed, type Ref, type ComputedRef } from "vue";
import { createLightTheme, createDarkTheme } from "@/themes/base";

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  warning: string;
  info: string;
  success: string;
  // Text colors (using kebab-case to match base.ts output)
  "on-primary": string;
  "on-secondary": string;
  "on-background": string;
  "on-surface": string;
  "on-error": string;
  "on-warning": string;
  "on-info": string;
  "on-success": string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  variables: {
    [key: string]: string | number;
  };
}

export interface ThemeData {
  light: Theme;
  dark: Theme;
  currentTheme: "light" | "dark";
}

export interface ThemeController {
  themeData: Ref<ThemeData | null>;
  currentTheme: Ref<"light" | "dark">;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  colors: ComputedRef<ThemeColors | null>;
  fetchThemeData: () => Promise<void>;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

// Global theme state
const themeData = ref<ThemeData | null>(null);
const currentTheme = ref<"light" | "dark">("light");
const loading = ref(false);
const error = ref<string | null>(null);

export function useThemeController(): ThemeController {
  // Computed current theme colors
  const colors = computed<ThemeColors | null>(() => {
    if (!themeData.value) return null;
    return themeData.value[currentTheme.value].colors;
  });

  const fetchThemeData = async (): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      // Fetch external-page.json
      const response = await axios.get("/data/external-page.json", {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = response.data;

      if (!data.theme?.primaryColor || !data.theme?.secondaryColor) {
        throw new Error("Theme colors not found in external-page.json");
      }

      const primaryColor = data.theme.primaryColor;
      const secondaryColor = data.theme.secondaryColor;

      // Create themes using base.ts functions
      const lightTheme = createLightTheme(primaryColor, secondaryColor);
      const darkTheme = createDarkTheme(primaryColor, secondaryColor);

      // Store theme data
      themeData.value = {
        light: lightTheme,
        dark: darkTheme,
        currentTheme: currentTheme.value,
      };

      console.log("Theme data loaded successfully from external-page.json");
    } catch (err) {
      console.error("Failed to fetch theme data:", err);
      error.value =
        err instanceof Error
          ? err.message
          : "Failed to load theme configuration";
      themeData.value = null;
    } finally {
      loading.value = false;
    }
  };

  const setTheme = (theme: "light" | "dark"): void => {
    currentTheme.value = theme;
    if (themeData.value) {
      themeData.value.currentTheme = theme;
    }
  };

  const toggleTheme = (): void => {
    const newTheme = currentTheme.value === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return {
    themeData,
    currentTheme,
    loading,
    error,
    colors,
    fetchThemeData,
    setTheme,
    toggleTheme,
  };
}
