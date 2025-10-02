<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import {
  MENU_CATEGORIES,
  getInventoryImageUrl,
  APP_CONFIG,
} from "@/utils/constants";

import Navbar from "@/components/common/customer/Navbar.vue";
import BestSellers from "@/components/common/customer/BestSellers.vue";
import CategorySelector from "@/components/common/customer/CategorySelector.vue";

const router = useRouter();

// Data structures
interface MenuItem {
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

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Reactive data
const cartItems = ref<MenuItem[]>([]);
const menuItems = ref<MenuItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Categories data from constants
const categories = ref<Category[]>(MENU_CATEGORIES);

// Fetch menu items from Supabase
const fetchMenuItems = async () => {
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
  } catch (err) {
    console.error("Error fetching menu items:", err);
    error.value = "Failed to load menu items. Please try again later.";
  } finally {
    loading.value = false;
  }
};

// Computed properties
const cartTotal = computed(() => {
  return cartItems.value.reduce((total, item) => total + item.price, 0);
});

// Methods
const getItemsByCategory = (categoryId: number) => {
  // Return all non-best-seller items for the "All Items" section
  const bestSellerIds = menuItems.value
    .sort((a, b) => (b.sales || 0) - (a.sales || 0))
    .slice(0, 3)
    .map((item) => item.id);
  return menuItems.value.filter((item) => !bestSellerIds.includes(item.id));
};

const addToCart = (item: MenuItem) => {
  cartItems.value.push({ ...item });
  // You could add a toast notification here
};

const viewCart = () => {
  // Navigate to cart page (you'll need to create this)
  router.push("/customer/cart");
};

// Lifecycle
onMounted(async () => {
  // Fetch menu items from Supabase
  await fetchMenuItems();
});
</script>

<template>
  <v-app>
    <!-- Fixed Header -->
    <Navbar :menu-items="menuItems" @add-to-cart="addToCart" />

    <!-- Content Area -->
    <v-main class="grey-lighten-5">
      <!-- Loading State -->
      <v-container
        v-if="loading"
        class="d-flex flex-column align-center justify-center fill-height"
      >
        <v-progress-circular
          indeterminate
          color="orange-darken-2"
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
          @click="fetchMenuItems"
          color="pink"
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
          color="orange-darken-2"
          class="mx-4 mt-4 mb-6"
          rounded="xl"
          elevation="2"
        >
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-3">
              <v-avatar size="60" class="mr-4">
                <v-img src="/public/assets/logo1.png" />
              </v-avatar>
              <div>
                <h1 class="text-h5 font-weight-bold text-white mb-1">
                  {{ APP_CONFIG.APP_NAME }}
                </h1>
                <div class="d-flex align-center">
                  <v-icon color="white" size="16" class="mr-1">mdi-star</v-icon>
                  <span class="text-white text-body-2 mr-3">4.8</span>
                  <v-icon color="white" size="16" class="mr-1"
                    >mdi-clock-outline</v-icon
                  >
                  <span class="text-white text-body-2">3-5 min</span>
                </div>
              </div>
            </div>
            <p class="text-white text-body-2 mb-0">
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
    </v-main>

    <!-- Fixed Bottom Cart -->
    <v-bottom-navigation
      v-if="cartItems.length > 0"
      grow
      class="px-4"
      height="80"
    >
      <v-btn
        @click="viewCart"
        color="pink"
        variant="flat"
        block
        size="large"
        rounded="xl"
        class="text-white font-weight-bold ma-2"
      >
        <template v-slot:prepend>
          <v-icon>mdi-cart</v-icon>
        </template>
        <span class="mx-2"
          >{{ cartItems.length }} item{{
            cartItems.length > 1 ? "s" : ""
          }}</span
        >
        <v-spacer />
        <span class="mr-2"
          >{{ APP_CONFIG.CURRENCY }}{{ cartTotal.toFixed(2) }}</span
        >
        <template v-slot:append>
          <v-icon>mdi-chevron-right</v-icon>
        </template>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
