/**
 * Theme Management Composable
 *
 * Handles dynamic theme loading from external-page.json
 * and applies themes to Vuetify instance
 */

import { readonly, ref } from "vue";
import { useThemeController } from "@/controller/themeController";

// Global state for theme loading
const isThemeLoaded = ref(false);
const themeLoadError = ref<string | null>(null);
const isLoadingTheme = ref(false);

export function useTheme() {
  const {
    fetchThemeData,
    toggleTheme: themeToggle,
    currentTheme,
    loading,
    error,
  } = useThemeController();

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

      // Load themes using the new controller
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
   * Toggle between light and dark themes
   */
  const toggleTheme = (): void => {
    themeToggle();
  };

  /**
   * Set specific theme
   */
  const setTheme = (themeName: "light" | "dark"): void => {
    // Use the controller's setTheme method, but we need to access it
    const controller = useThemeController();
    controller.setTheme(themeName);
  };

  /**
   * Get current theme name
   */
  const getCurrentTheme = (): string => {
    return currentTheme.value || "light";
  };

  return {
    // State
    isThemeLoaded: readonly(isThemeLoaded),
    themeLoadError: readonly(themeLoadError),
    isLoadingTheme: readonly(loading),

    // Actions
    initializeTheme,
    toggleTheme,
    setTheme,
    getCurrentTheme,
  };
}
