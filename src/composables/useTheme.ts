/**
 * Theme Management Composable
 *
 * Handles dynamic theme loading from external-page.json
 * and applies themes to Vuetify instance
 * Flow: external-page.json → base.ts → useTheme.ts → UI components
 */

import axios from "axios";
import { ref, computed, type ComputedRef } from "vue";
import { createLightTheme, createDarkTheme } from "@/themes/base";

// Theme interfaces
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

// Global state for theme management
const themeData = ref<ThemeData | null>(null);
const currentTheme = ref<"light" | "dark">("light");
const isThemeLoaded = ref(false);
const themeLoadError = ref<string | null>(null);
const isLoadingTheme = ref(false);

export interface UseTheme {
  // State
  isThemeLoaded: ComputedRef<boolean>;
  themeLoadError: ComputedRef<string | null>;
  isLoadingTheme: ComputedRef<boolean>;

  // Theme colors
  colors: ComputedRef<ThemeColors | null>;
  primaryColor: ComputedRef<string>;
  secondaryColor: ComputedRef<string>;
  accentColor: ComputedRef<string>;
  backgroundColor: ComputedRef<string>;
  surfaceColor: ComputedRef<string>;
  textPrimary: ComputedRef<string>;
  textSecondary: ComputedRef<string>;
  textOnPrimary: ComputedRef<string>;
  errorColor: ComputedRef<string>;
  successColor: ComputedRef<string>;
  warningColor: ComputedRef<string>;
  infoColor: ComputedRef<string>;
  currentTheme: ComputedRef<"light" | "dark">;

  // Actions
  initializeTheme: () => Promise<void>;
  toggleTheme: () => void;
  setTheme: (themeName: "light" | "dark") => void;
  getCurrentTheme: () => string;
}

export function useTheme(): UseTheme {
  // Computed current theme colors
  const colors = computed<ThemeColors | null>(() => {
    if (!themeData.value) return null;
    return themeData.value[currentTheme.value].colors;
  });

  /**
   * Fetch theme data from external-page.json and create themes using base.ts
   */
  const fetchThemeData = async (): Promise<void> => {
    try {
      isLoadingTheme.value = true;
      themeLoadError.value = null;

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
      themeLoadError.value =
        err instanceof Error
          ? err.message
          : "Failed to load theme configuration";
      themeData.value = null;
    } finally {
      isLoadingTheme.value = false;
    }
  };

  /**
   * Initialize and load dynamic themes from external-page.json
   */
  const initializeTheme = async (): Promise<void> => {
    if (isThemeLoaded.value) {
      return; // Already loaded
    }

    try {
      isLoadingTheme.value = true;
      themeLoadError.value = null;

      // Load themes using base.ts
      await fetchThemeData();

      isThemeLoaded.value = true;
      console.log("Dynamic themes loaded successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load theme configuration";
      themeLoadError.value = errorMessage;
      console.error("Theme initialization failed:", error);
      throw error;
    } finally {
      isLoadingTheme.value = false;
    }
  };

  /**
   * Set specific theme
   */
  const setTheme = (theme: "light" | "dark"): void => {
    currentTheme.value = theme;
    if (themeData.value) {
      themeData.value.currentTheme = theme;
    }
  };

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = (): void => {
    const newTheme = currentTheme.value === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  /**
   * Get current theme name
   */
  const getCurrentTheme = (): string => {
    return currentTheme.value || "light";
  };

  // Individual color getters with fallbacks from base.ts theme
  const primaryColor = computed(() => colors.value?.primary || "#8b5c2a");
  const secondaryColor = computed(() => colors.value?.secondary || "#c19a6b");
  const accentColor = computed(() => colors.value?.accent || "#a67c52");
  const backgroundColor = computed(() => colors.value?.background || "#FEFFFE");
  const surfaceColor = computed(() => colors.value?.surface || "#FFFFFF");
  const textPrimary = computed(() => colors.value?.["on-surface"] || "#1C1D1A");
  const textSecondary = computed(
    () => colors.value?.["on-secondary"] || "#FFFFFF"
  );
  const textOnPrimary = computed(
    () => colors.value?.["on-primary"] || "#FFFFFF"
  );
  const errorColor = computed(() => colors.value?.error || "#DC3545");
  const successColor = computed(() => colors.value?.success || "#28A745");
  const warningColor = computed(() => colors.value?.warning || "#FFC107");
  const infoColor = computed(() => colors.value?.info || "#17A2B8");

  return {
    // State
    isThemeLoaded: computed(() => isThemeLoaded.value),
    themeLoadError: computed(() => themeLoadError.value),
    isLoadingTheme: computed(() => isLoadingTheme.value),

    // Theme colors from base.ts
    colors,
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    surfaceColor,
    textPrimary,
    textSecondary,
    textOnPrimary,
    errorColor,
    successColor,
    warningColor,
    infoColor,
    currentTheme: computed(() => currentTheme.value),

    // Actions
    initializeTheme,
    toggleTheme,
    setTheme,
    getCurrentTheme,
  };
}
