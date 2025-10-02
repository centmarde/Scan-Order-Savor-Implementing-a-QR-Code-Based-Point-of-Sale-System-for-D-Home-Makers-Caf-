/**
 * Menu Composable
 *
 * Provides a clean API for components to interact with menu data
 * Wraps the menu store and adds additional computed properties and methods
 */

import { computed, type ComputedRef } from "vue";
import { useMenuDataStore, type MenuItem } from "@/stores/menuData";

export interface UseMenu {
  // State
  menuItems: ComputedRef<MenuItem[]>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<string | null>;
  isDataStale: ComputedRef<boolean>;

  // Actions
  fetchMenuItems: (forceRefresh?: boolean) => Promise<void>;
  refreshMenuItems: () => Promise<void>;
  clearError: () => void;

  // Computed getters
  bestSellerItems: ComputedRef<MenuItem[]>;
  availableCategories: ComputedRef<string[]>;
  totalItems: ComputedRef<number>;
  hasItems: ComputedRef<boolean>;

  // Methods
  getItemsByCategory: (category?: string) => MenuItem[];
  getItemById: (id: number) => MenuItem | undefined;
  searchItems: (query: string) => MenuItem[];
  getBestSellers: (count?: number) => MenuItem[];
}

export function useMenu(): UseMenu {
  const store = useMenuDataStore();

  // Computed properties
  const menuItems = computed(() => store.menuItems);
  const loading = computed(() => store.loading);
  const error = computed(() => store.error);

  const isDataStale = computed(() => {
    if (!store.lastFetchTime) return true;
    const timeSinceLastFetch = Date.now() - store.lastFetchTime.getTime();
    return timeSinceLastFetch > 10 * 60 * 1000; // 10 minutes
  });

  const bestSellerItems = computed(() => store.getBestSellerItems());
  const availableCategories = computed(() => store.getAvailableCategories());
  const totalItems = computed(() => store.menuItems.length);
  const hasItems = computed(() => store.menuItems.length > 0);

  // Actions
  const fetchMenuItems = async (forceRefresh = false): Promise<void> => {
    await store.fetchMenuItems(forceRefresh);
  };

  const refreshMenuItems = async (): Promise<void> => {
    await store.refreshMenuItems();
  };

  const clearError = (): void => {
    store.clearError();
  };

  // Methods that wrap store getters
  const getItemsByCategory = (category?: string): MenuItem[] => {
    return store.getItemsByCategory(category);
  };

  const getItemById = (id: number): MenuItem | undefined => {
    return store.getItemById(id);
  };

  const searchItems = (query: string): MenuItem[] => {
    return store.searchItems(query);
  };

  const getBestSellers = (count = 3): MenuItem[] => {
    return store.getBestSellerItems(count);
  };

  return {
    // State
    menuItems,
    loading,
    error,
    isDataStale,

    // Actions
    fetchMenuItems,
    refreshMenuItems,
    clearError,

    // Computed getters
    bestSellerItems,
    availableCategories,
    totalItems,
    hasItems,

    // Methods
    getItemsByCategory,
    getItemById,
    searchItems,
    getBestSellers,
  };
}
