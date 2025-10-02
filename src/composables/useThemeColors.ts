/**
 * Theme Colors Composable
 *
 * Provides theme colors to UI components from theme controller
 * Flow: external-page.json → themeController → this composable → UI components
 */

import { computed, type ComputedRef } from "vue";
import {
  useThemeController,
  type ThemeColors,
} from "@/controller/themeController";

export interface UseThemeColors {
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
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export function useThemeColors(): UseThemeColors {
  const {
    colors,
    currentTheme: themeRef,
    toggleTheme,
    setTheme,
  } = useThemeController();

  // Convert currentTheme Ref to ComputedRef for consistency
  const currentTheme = computed(() => themeRef.value);

  // Individual color getters with fallbacks
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
    currentTheme,
    toggleTheme,
    setTheme,
  };
}
