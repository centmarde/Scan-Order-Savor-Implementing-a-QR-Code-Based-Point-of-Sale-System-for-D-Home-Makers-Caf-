/**
 * Menu Data Store
 *
 * Manages menu items fetching, loading states, and error handling
 * Provides centralized state management for menu-related data
 */

import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "@/lib/supabase";
import { getInventoryImageUrl } from "@/utils/constants";

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
  sales: number;
  category?: string;
  created_at: string;
}

export const useMenuDataStore = defineStore("menuData", () => {
  // State
  const menuItems = ref<MenuItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetchTime = ref<Date | null>(null);

  // Actions
  const fetchMenuItems = async (forceRefresh = false): Promise<void> => {
    // Avoid unnecessary refetches unless forced
    if (!forceRefresh && menuItems.value.length > 0 && lastFetchTime.value) {
      const timeSinceLastFetch = Date.now() - lastFetchTime.value.getTime();
      if (timeSinceLastFetch < 5 * 60 * 1000) {
        // 5 minutes cache
        return;
      }
    }

    try {
      loading.value = true;
      error.value = null;

      const { data, error: fetchError } = await supabase
        .from("menu")
        .select("*")
        .order("name");

      if (fetchError) {
        throw fetchError;
      }

      // Process the data to ensure image URLs point to Supabase storage
      menuItems.value = (data || []).map((item) => ({
        ...item,
        // If image is just a filename without full URL, prepend the Supabase storage URL
        image: item.image?.includes("http")
          ? item.image
          : getInventoryImageUrl(item.image || "default.jpg"),
      }));

      lastFetchTime.value = new Date();
      console.log(`Fetched ${menuItems.value.length} menu items`);
    } catch (err) {
      console.error("Error fetching menu items:", err);
      error.value = "Failed to load menu items. Please try again later.";
      menuItems.value = [];
    } finally {
      loading.value = false;
    }
  };

  const clearError = (): void => {
    error.value = null;
  };

  const refreshMenuItems = async (): Promise<void> => {
    await fetchMenuItems(true);
  };

  // Getters
  const getBestSellerItems = (count = 3): MenuItem[] => {
    return menuItems.value
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, count);
  };

  const getItemsByCategory = (category?: string): MenuItem[] => {
    if (!category || category === "All") {
      return menuItems.value;
    }
    return menuItems.value.filter((item) => item.category === category);
  };

  const getAvailableCategories = (): string[] => {
    const categories = new Set(
      menuItems.value
        .map((item) => item.category)
        .filter((category): category is string => Boolean(category))
    );
    return ["All", ...Array.from(categories)];
  };

  const getItemById = (id: number): MenuItem | undefined => {
    return menuItems.value.find((item) => item.id === id);
  };

  const searchItems = (query: string): MenuItem[] => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase().trim();
    return menuItems.value.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.category?.toLowerCase().includes(searchTerm)
    );
  };

  return {
    // State
    menuItems,
    loading,
    error,
    lastFetchTime,

    // Actions
    fetchMenuItems,
    clearError,
    refreshMenuItems,

    // Getters
    getBestSellerItems,
    getItemsByCategory,
    getAvailableCategories,
    getItemById,
    searchItems,
  };
});
