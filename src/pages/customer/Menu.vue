z
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router"; // <-- Import useRoute
import { APP_CONFIG } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";
import { useMenu } from "@/composables/useMenu";
import { useTableStore } from "@/stores/tableStores"; // <-- Import new store
import { useToast } from "vue-toastification";
import type { MenuItem } from "@/stores/menuData";

import Navbar from "@/components/common/customer/Navbar.vue";
import BestSellers from "@/components/common/customer/BestSellers.vue";
import CategorySelector from "@/components/common/customer/CategorySelector.vue";
import YourOrder from "@/components/common/customer/YourOrder.vue";

const router = useRouter();
const route = useRoute(); // <-- Initialize useRoute

// Initialize the new table store
const tableStore = useTableStore();
const toast = useToast();

// Theme setup
const { initializeTheme, primaryColor, secondaryColor, backgroundColor } =
  useTheme();

// Menu data management
const { menuItems, loading, error, fetchMenuItems, clearError, hasItems } =
  useMenu();

const addToCart = (item: MenuItem) => {
  // Get existing cart from storage or create empty array
  const existingCart = JSON.parse(sessionStorage.getItem('cartItems') || '[]');

  // Count current quantity of this item in cart
  const currentQuantityInCart = existingCart.filter((cartItem: MenuItem) => cartItem.id === item.id).length;

  // Check if adding one more would exceed available quantity
  if (currentQuantityInCart >= item.quantity) {
    toast.warning(`Maximum quantity reached! Only ${item.quantity} available in stock.`);
    return;
  }

  existingCart.push({ ...item });

  // Save to both storage methods for persistence
  sessionStorage.setItem('cartItems', JSON.stringify(existingCart));
  localStorage.setItem('cartItems', JSON.stringify(existingCart));

  // Trigger YourOrder component to refresh by dispatching a custom event
  window.dispatchEvent(new CustomEvent('cartUpdated'));
};

// Lifecycle
onMounted(async () => {
  // 1. CAPTURE TABLE ID FROM URL
  if (route.query.table && typeof route.query.table === "string") {
    const tableId = parseInt(route.query.table, 10);

    if (!isNaN(tableId) && tableId > 0) {
      // Set the table ID in the session store
      tableStore.setTableId(tableId);
    } else {
      console.warn(
        `[Table Capture] Invalid table ID found: ${route.query.table}`
      );
    }
  } else if (tableStore.currentTableId === null) {
    // Optional: Log a warning or prompt the user if they navigate here directly
    console.warn(
      "[Table Capture] Menu accessed without a table ID query parameter."
    );
    // In a production app, you might show a modal asking them to manually enter their table number.
  }

  // Initialize theme first
  await initializeTheme();
  // Fetch menu items from Supabase
  await fetchMenuItems();
});
</script>

<template>
  <v-app>
    <!-- Fixed Header -->
    <Navbar :menu-items="menuItems" @add-to-cart="addToCart" />

    <!-- Content Area -->
    <v-main style="background-color: #f5f3ef">
      <!-- Loading State -->
      <v-container
        v-if="loading"
        class="d-flex flex-column align-center justify-center fill-height"
      >
        <v-progress-circular
          indeterminate
          color="primary"
          size="48"
          class="mb-4"
        ></v-progress-circular>
        <p class="text-body-1 text-grey-darken-1">Loading delicious food...</p>
      </v-container>

      <!-- Error State -->
      <v-container v-else-if="error" class="text-center pa-8">
        <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
        <p class="text-h6 text-error mb-4">{{ error }}</p>
        <v-btn
          @click="() => fetchMenuItems(true)"
          color="primary"
          variant="flat"
          rounded="xl"
          class="px-6"
        >
          Try Again
        </v-btn>
      </v-container>

      <!-- Menu Content -->
      <div v-else class="pb-16">
        <!-- Restaurant Info Banner -->
        <v-card
          class="mx-4 mt-4 mb-6"
          rounded="xl"
          elevation="2"
          :style="{ backgroundColor: primaryColor }"
        >
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-3">
              <v-avatar size="60" class="mr-4">
                <v-img src="/public/assets/logo2.jpg" />
              </v-avatar>
              <div>
                <h1 class="text-h5 font-weight-bold mb-1 text-white">
                  {{ APP_CONFIG.APP_NAME }}
                </h1>
                <div class="d-flex align-center">
                  <v-icon
                    :style="{ color: secondaryColor }"
                    size="16"
                    class="mr-1"
                    >mdi-star</v-icon
                  >
                  <span
                    class="text-body-2 mr-3"
                    :style="{ color: secondaryColor }"
                    >4.8</span
                  >
                  <v-icon
                    :style="{ color: secondaryColor }"
                    size="16"
                    class="mr-1"
                    >mdi-clock-outline</v-icon
                  >
                  <span class="text-body-2" :style="{ color: secondaryColor }"
                    >3-5 min</span
                  >
                </div>
              </div>
            </div>
            <p class="text-body-2 mb-0 text-white">
              Authentic Filipino cuisine • Fresh ingredients • Pick your meals
              and check out your order
            </p>
          </v-card-text>
        </v-card>

        <!-- Best Sellers Section -->
        <BestSellers :menu-items="menuItems" @add-to-cart="addToCart" />

        <!-- Category Selector and Menu Items -->
        <CategorySelector :menu-items="menuItems" @add-to-cart="addToCart" />
      </div>

      <!-- Your Order Section -->
      <YourOrder />
    </v-main>
  </v-app>
</template>
