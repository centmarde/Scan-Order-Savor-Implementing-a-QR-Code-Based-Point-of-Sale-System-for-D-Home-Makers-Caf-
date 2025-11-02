/**
 * Application-wide constants
 */

// Supabase Storage URLs
export const STORAGE_URLS = {
  // Base URL for Supabase storage
  SUPABASE_STORAGE_BASE:
    "https://zbmsbhwybyguxpzxyjkz.supabase.co/storage/v1/object/public/",

  // Specific bucket URLs
  INVENTORY_BUCKET:
    "https://zbmsbhwybyguxpzxyjkz.supabase.co/storage/v1/object/public/inventory/",
};

// Helper function to get image URL from inventory bucket
export const getInventoryImageUrl = (filename: string): string => {
  return `${STORAGE_URLS.INVENTORY_BUCKET}/${filename}`;
};

// Menu categories
export const MENU_CATEGORIES = [
  {
    id: 1,
    name: "All Items",
    description: "View all available menu items",
    icon: "mdi-food",
    color: "primary",
  },
  // You can add more categories here as needed
];

// Menu item categories for forms and dropdowns
export const MENU_ITEM_CATEGORIES = [
  "Main Dish",
  "Soup",
  "Vegetable Dish",
  "Appetizer",
  "Dessert",
  "Beverage",
];

// App configuration
export const APP_CONFIG = {
  CURRENCY: "₱", // Philippine Peso
  APP_NAME: "D' Home Makers Café",
  DEFAULT_IMAGE: "/assets/logo1.png", // Fallback image
};
