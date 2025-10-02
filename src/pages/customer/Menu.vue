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
const selectedCategory = ref<string>("All");
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

const allCategories = computed(() => {
  // Get unique categories from menu items and add "All" at the beginning
  const categorySet = new Set(
    menuItems.value
      .map((item) => item.category)
      .filter((category): category is string => Boolean(category))
  );
  return ["All", ...Array.from(categorySet)];
});

const filteredMenuItems = computed(() => {
  if (selectedCategory.value === "All") {
    return menuItems.value;
  }
  return menuItems.value.filter(
    (item) => item.category === selectedCategory.value
  );
});

const getCategoryItemCount = (category: string) => {
  if (category === "All") {
    return menuItems.value.length;
  }
  return menuItems.value.filter((item) => item.category === category).length;
};

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

const selectCategory = (category: string) => {
  selectedCategory.value = category;
};

const getCategoryIcon = (category: string) => {
  // Map category names to appropriate icons
  const iconMap: { [key: string]: string } = {
    All: "mdi-food",
    "Main Course": "mdi-food",
    Appetizer: "mdi-food-variant",
    Dessert: "mdi-cake",
    Beverage: "mdi-cup",
    Coffee: "mdi-coffee",
    Tea: "mdi-tea",
    Snack: "mdi-cookie",
    Soup: "mdi-bowl-mix",
    Salad: "mdi-food-apple",
    Sandwich: "mdi-food-croissant",
    Pizza: "mdi-pizza",
    Pasta: "mdi-pasta",
  };
  return iconMap[category] || "mdi-food";
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
    <Navbar />

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

        <!-- Category Chips -->
        <v-container class="px-4 py-2">
          <div class="d-flex overflow-x-auto pb-2" style="gap: 8px">
            <v-chip
              v-for="category in allCategories"
              :key="category"
              @click="selectCategory(category)"
              :variant="selectedCategory === category ? 'flat' : 'outlined'"
              :color="
                selectedCategory === category
                  ? 'orange-darken-2'
                  : 'grey-lighten-2'
              "
              :text-color="
                selectedCategory === category ? 'white' : 'grey-darken-2'
              "
              class="flex-shrink-0"
              rounded="xl"
              size="default"
            >
              <template v-slot:prepend>
                <v-icon size="18" class="mr-1">
                  {{ getCategoryIcon(category) }}
                </v-icon>
              </template>
              {{ category }}
            </v-chip>
          </div>
        </v-container>

        <!-- Menu Items Section -->
        <v-container class="px-4 pb-6">
          <div class="d-flex align-center justify-between mb-4">
            <div class="d-flex align-center">
              <v-icon color="grey-darken-2" size="24" class="mr-2"
                >mdi-food</v-icon
              >
              <h2 class="text-h6 font-weight-bold text-grey-darken-3">
                {{
                  selectedCategory === "All" ? "All Items" : selectedCategory
                }}
              </h2>
            </div>
            <v-chip size="small" variant="outlined" color="grey">
              {{ filteredMenuItems.length }} items
            </v-chip>
          </div>

          <!-- Menu Items List -->
          <div v-if="filteredMenuItems.length > 0">
            <v-card
              v-for="item in filteredMenuItems"
              :key="item.id"
              elevation="1"
              class="mb-3"
              @click="addToCart(item)"
              rounded="xl"
              hover
              :disabled="item.quantity === 0"
            >
              <v-card-text class="pa-3">
                <div class="d-flex">
                  <div class="flex-grow-1 pr-3">
                    <h3
                      class="text-body-1 font-weight-bold text-grey-darken-3 mb-1"
                    >
                      {{ item.name }}
                    </h3>
                    <p class="text-caption text-grey-darken-1 mb-2">
                      {{ item.description }}
                    </p>

                    <!-- Stock indicator -->
                    <div
                      v-if="item.quantity > 0 && item.quantity <= 5"
                      class="mb-2"
                    >
                      <v-chip
                        size="x-small"
                        color="orange"
                        variant="flat"
                        class="text-white"
                      >
                        Only {{ item.quantity }} left
                      </v-chip>
                    </div>

                    <span
                      class="text-h6 font-weight-bold"
                      :class="
                        item.quantity === 0
                          ? 'text-grey'
                          : 'text-orange-darken-2'
                      "
                    >
                      {{ APP_CONFIG.CURRENCY }}{{ item.price.toFixed(2) }}
                    </span>
                  </div>
                  <div class="d-flex flex-column align-center">
                    <div class="position-relative mb-2">
                      <v-img
                        :src="item.image"
                        :alt="item.name"
                        width="80"
                        height="80"
                        cover
                        class="rounded-lg"
                      />
                      <v-overlay
                        v-if="item.quantity === 0"
                        contained
                        class="d-flex align-center justify-center rounded-lg"
                      >
                        <span class="text-white text-caption font-weight-bold">
                          Out of Stock
                        </span>
                      </v-overlay>
                    </div>
                    <v-btn
                      v-if="item.quantity > 0"
                      @click.stop="addToCart(item)"
                      icon
                      size="small"
                      color="orange-darken-2"
                      variant="flat"
                    >
                      <v-icon size="20">mdi-plus</v-icon>
                    </v-btn>
                    <v-btn v-else disabled icon size="small" variant="outlined">
                      <v-icon size="20">mdi-close</v-icon>
                    </v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>

          <!-- No Items State -->
          <v-card
            v-else
            class="text-center pa-8"
            variant="outlined"
            rounded="xl"
          >
            <v-icon color="grey-lighten-1" size="64" class="mb-4"
              >mdi-food-off</v-icon
            >
            <p class="text-h6 text-grey-darken-1 mb-2">No Items Available</p>
            <p class="text-body-2 text-grey">
              No items found in this category.
            </p>
          </v-card>
        </v-container>
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
