/**
 * Inventory Data Store
 *
 * Manages inventory/menu items with CRUD operations, image upload functionality,
 * and centralized state management for admin inventory operations
 */

import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "@/lib/supabase";
import { getInventoryImageUrl } from "@/utils/constants";

export interface InventoryItem {
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

export const useInventoryDataStore = defineStore("inventoryData", () => {
  // State
  const inventoryItems = ref<InventoryItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetchTime = ref<Date | null>(null);

  // Actions
  const fetchInventoryItems = async (forceRefresh = false): Promise<void> => {
    // Avoid unnecessary refetches unless forced
    if (
      !forceRefresh &&
      inventoryItems.value.length > 0 &&
      lastFetchTime.value
    ) {
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
        .order("id", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // Process the data to ensure image URLs point to Supabase storage
      inventoryItems.value = (data || []).map((item) => ({
        ...item,
        // If image is just a filename without full URL, prepend the Supabase storage URL
        image: item.image?.includes("http")
          ? item.image
          : getInventoryImageUrl(item.image || "default.jpg"),
      }));

      lastFetchTime.value = new Date();
      console.log(`Fetched ${inventoryItems.value.length} inventory items`);
    } catch (err) {
      console.error("Error fetching inventory items:", err);
      error.value = "Failed to load inventory items. Please try again later.";
      inventoryItems.value = [];
    } finally {
      loading.value = false;
    }
  };

  const uploadImage = async (imageFile: File): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      // Generate unique filename
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      console.log(
        "Attempting to upload file:",
        fileName,
        "to bucket: inventory"
      );

      // Upload directly to Supabase storage
      const { data, error } = await supabase.storage
        .from("inventory")
        .upload(fileName, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading image:", error);
        console.error("Full error details:", JSON.stringify(error, null, 2));

        // Provide more specific error messages
        if (
          error.message.includes("row-level security") ||
          error.message.includes("policy")
        ) {
          throw new Error(
            "Permission denied: Storage policies need configuration. Please check Supabase storage policies."
          );
        } else if (error.message.includes("Bucket not found")) {
          throw new Error(
            "Storage bucket access issue. Please verify bucket permissions."
          );
        } else if (error.message.includes("duplicate")) {
          // Try with a different filename if duplicate
          const retryFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}-retry.${fileExt}`;
          const { data: retryData, error: retryError } = await supabase.storage
            .from("inventory")
            .upload(retryFileName, imageFile, {
              cacheControl: "3600",
              upsert: false,
            });

          if (retryError) {
            throw new Error(`Upload retry failed: ${retryError.message}`);
          }

          console.log("Upload successful on retry:", retryData);
          return retryFileName;
        } else {
          throw new Error(`Upload failed: ${error.message}`);
        }
      }

      console.log("Upload successful:", data);
      return fileName; // Return the filename, not the full path
    } catch (error) {
      console.error("Error in uploadImage:", error);
      throw error;
    }
  };

  const addInventoryItem = async (
    itemData: Omit<InventoryItem, "id" | "created_at">,
    imageFile?: File | null
  ): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      // Upload image first if one is provided
      let imagePath = "";

      if (imageFile) {
        try {
          const uploadedFileName = await uploadImage(imageFile);
          if (uploadedFileName) {
            imagePath = uploadedFileName; // Store just the filename
          }
        } catch (uploadError) {
          throw new Error(
            `Failed to upload image: ${
              uploadError instanceof Error
                ? uploadError.message
                : "Unknown error"
            }`
          );
        }
      }

      // Create the item data with the image path
      const finalItemData = {
        ...itemData,
        image: imagePath,
      };

      const { error: insertError } = await supabase
        .from("menu")
        .insert([finalItemData]);

      if (insertError) {
        throw new Error(`Error adding item: ${insertError.message}`);
      }

      // Refresh the inventory list
      await fetchInventoryItems(true);
    } catch (err) {
      console.error("Error in addInventoryItem:", err);
      error.value = err instanceof Error ? err.message : "Failed to add item";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateInventoryItem = async (
    itemId: number,
    itemData: Omit<InventoryItem, "id" | "created_at">,
    imageFile?: File | null
  ): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      // Upload new image if one is provided
      let imagePath = itemData.image; // Keep existing image if no new one

      if (imageFile) {
        try {
          const uploadedFileName = await uploadImage(imageFile);
          if (uploadedFileName) {
            imagePath = uploadedFileName; // Store just the filename
          }
        } catch (uploadError) {
          throw new Error(
            `Failed to upload image: ${
              uploadError instanceof Error
                ? uploadError.message
                : "Unknown error"
            }`
          );
        }
      }

      // Create the item data with the image path
      const finalItemData = {
        ...itemData,
        image: imagePath,
      };

      const { error: updateError } = await supabase
        .from("menu")
        .update(finalItemData)
        .eq("id", itemId);

      if (updateError) {
        throw new Error(`Error updating item: ${updateError.message}`);
      }

      // Refresh the inventory list
      await fetchInventoryItems(true);
    } catch (err) {
      console.error("Error in updateInventoryItem:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to update item";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteInventoryItem = async (itemId: number): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      const { error: deleteError } = await supabase
        .from("menu")
        .delete()
        .eq("id", itemId);

      if (deleteError) {
        throw new Error(`Error deleting item: ${deleteError.message}`);
      }

      // Refresh the inventory list
      await fetchInventoryItems(true);
    } catch (err) {
      console.error("Error in deleteInventoryItem:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to delete item";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const clearError = (): void => {
    error.value = null;
  };

  const refreshInventoryItems = async (): Promise<void> => {
    await fetchInventoryItems(true);
  };

  // Getters
  const searchItems = (query: string): InventoryItem[] => {
    if (!query.trim()) return inventoryItems.value;

    const searchTerm = query.toLowerCase().trim();
    return inventoryItems.value.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.category?.toLowerCase().includes(searchTerm)
    );
  };

  const getItemsByCategory = (category?: string): InventoryItem[] => {
    if (!category || category === "All") {
      return inventoryItems.value;
    }
    return inventoryItems.value.filter((item) => item.category === category);
  };

  const getAvailableCategories = (): string[] => {
    const categories = new Set(
      inventoryItems.value
        .map((item) => item.category)
        .filter((category): category is string => Boolean(category))
    );
    return ["All", ...Array.from(categories)];
  };

  const getItemById = (id: number): InventoryItem | undefined => {
    return inventoryItems.value.find((item) => item.id === id);
  };

  return {
    // State
    inventoryItems,
    loading,
    error,
    lastFetchTime,

    // Actions
    fetchInventoryItems,
    uploadImage,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    clearError,
    refreshInventoryItems,

    // Getters
    searchItems,
    getItemsByCategory,
    getAvailableCategories,
    getItemById,
  };
});
