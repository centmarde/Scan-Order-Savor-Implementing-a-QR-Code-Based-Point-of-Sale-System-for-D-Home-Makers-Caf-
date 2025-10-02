<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { APP_CONFIG } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";
import { useMenu } from "@/composables/useMenu";
import type { MenuItem } from "@/stores/menuData";

import Navbar from "@/components/common/customer/Navbar.vue";
import BestSellers from "@/components/common/customer/BestSellers.vue";
import CategorySelector from "@/components/common/customer/CategorySelector.vue";
import YourOrder from "@/components/common/customer/YourOrder.vue";

const router = useRouter();

// Theme setup
const { initializeTheme, primaryColor, secondaryColor, backgroundColor } =
  useTheme();

// Menu data management
const { menuItems, loading, error, fetchMenuItems, clearError, hasItems } =
  useMenu();

// Local cart state (could be moved to separate cart store later)
const cartItems = ref<MenuItem[]>([]);

// Computed properties
const cartTotal = computed(() => {
  return cartItems.value.reduce(
    (total: number, item: MenuItem) => total + item.price,
    0
  );
});

const addToCart = (item: MenuItem) => {
  cartItems.value.push({ ...item });
  // You could add a toast notification here
};

const removeFromCart = (itemId: number) => {
  // Find the first occurrence of the item with this ID and remove it
  const index = cartItems.value.findIndex((item) => item.id === itemId);
  if (index !== -1) {
    cartItems.value.splice(index, 1);
  }
};

const viewCart = () => {
  // Navigate to cart page (you'll need to create this)
  router.push("/customer/cart");
};

const cancelOrder = () => {
  // Clear all cart items
  cartItems.value = [];
};

const reviewOrder = () => {
  // Navigate to checkout/review page
  router.push("/customer/checkout");
};

// Lifecycle
onMounted(async () => {
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
      <div v-else class="pb-4">
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
                <v-img src="/public/assets/logo1.png" />
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
                  <span class="text-body-2 mr-3 text-grey-lighten-2">4.8</span>
                  <v-icon
                    :style="{ color: secondaryColor }"
                    size="16"
                    class="mr-1"
                    >mdi-clock-outline</v-icon
                  >
                  <span class="text-body-2 text-grey-lighten-2">3-5 min</span>
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
      <YourOrder
        :cart-items="cartItems"
        @view-cart="viewCart"
        @cancel-order="cancelOrder"
        @review-order="reviewOrder"
        @remove-item="removeFromCart"
      />
    </v-main>
  </v-app>
</template>
