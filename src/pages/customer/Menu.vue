<template>
  <v-container fluid class="pa-0">
    <!-- Header Section -->
    <v-card color="primary" class="mb-6">
      <v-card-text class="text-center py-8">
        <h1 class="text-h3 font-weight-bold text-white mb-4">Our Menu</h1>
        <p class="text-h6 text-white opacity-90">
          Discover our delicious selection of carefully crafted dishes
        </p>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <v-container v-if="loading" class="text-center py-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
        class="mb-4"
      ></v-progress-circular>
      <p class="text-h6">Loading menu items...</p>
    </v-container>

    <!-- Error State -->
    <v-container v-else-if="error" class="text-center py-8">
      <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
      <p class="text-h6 text-error mb-4">{{ error }}</p>
      <v-btn @click="fetchMenuItems" color="primary" variant="outlined">
        Try Again
      </v-btn>
    </v-container>

    <!-- Menu Content -->
    <div v-else>
      <!-- Best Sellers Section -->
      <v-container class="mb-8">
        <div class="text-center mb-6">
          <h2
            class="text-h4 font-weight-bold mb-2 d-flex align-center justify-center"
          >
            <v-icon color="warning" size="32" class="mr-2">mdi-star</v-icon>
            Best Sellers
          </h2>
          <p class="text-subtitle-1 text-grey-darken-1">
            Our most popular dishes loved by customers
          </p>
        </div>

        <v-row>
          <v-col
            v-for="item in bestSellers"
            :key="item.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              elevation="4"
              rounded="xl"
              class="h-100"
              style="border: 2px solid #ffd700"
            >
              <div style="position: relative">
                <v-img :src="item.image" :alt="item.name" height="200" cover />
                <v-chip
                  color="warning"
                  size="small"
                  class="ma-2"
                  style="position: absolute; top: 0; left: 0"
                  prepend-icon="mdi-star"
                  variant="flat"
                >
                  Best Seller
                </v-chip>
              </div>

              <v-card-text>
                <h3 class="text-h6 font-weight-bold mb-2">{{ item.name }}</h3>
                <p class="text-body-2 text-grey-darken-1 mb-4">
                  {{ item.description }}
                </p>

                <div class="d-flex justify-space-between align-center">
                  <div class="text-h6 font-weight-bold text-success">
                    ${{ item.price.toFixed(2) }}
                  </div>
                  <v-btn
                    @click="addToCart(item)"
                    color="primary"
                    size="small"
                    rounded="lg"
                    prepend-icon="mdi-plus"
                  >
                    Add
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <!-- Menu Categories Section -->
      <v-container>
        <!-- Category Filter Tabs -->
        <div class="text-center mb-6">
          <v-chip-group
            v-model="selectedCategory"
            selected-class="text-primary"
            mandatory
          >
            <v-chip
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
              size="large"
              class="ma-1"
              :prepend-icon="category.icon"
            >
              {{ category.name }}
            </v-chip>
          </v-chip-group>
        </div>

        <!-- Menu Items by Category -->
        <div v-for="category in categories" :key="category.id">
          <div
            v-if="selectedCategory === category.id || selectedCategory === null"
          >
            <v-card class="mb-6" elevation="2" rounded="xl">
              <v-card-text class="text-center py-6">
                <h2
                  class="text-h4 font-weight-bold mb-2 d-flex align-center justify-center"
                >
                  <v-icon :color="category.color" size="28" class="mr-2">
                    {{ category.icon }}
                  </v-icon>
                  {{ category.name }}
                </h2>
                <p class="text-subtitle-1 text-grey-darken-1">
                  {{ category.description }}
                </p>
              </v-card-text>
            </v-card>

            <v-row class="mb-8">
              <v-col
                v-for="item in getItemsByCategory(category.id)"
                :key="item.id"
                cols="12"
                sm="6"
                md="4"
              >
                <v-card elevation="4" rounded="xl" class="h-100">
                  <div style="position: relative">
                    <v-img
                      :src="item.image"
                      :alt="item.name"
                      height="200"
                      cover
                    />
                    <v-chip
                      v-if="item.quantity === 0"
                      color="red"
                      size="x-small"
                      class="ma-2"
                      style="position: absolute; top: 0; right: 0"
                      variant="flat"
                    >
                      Out of Stock
                    </v-chip>
                  </div>

                  <v-card-text>
                    <h3 class="text-h6 font-weight-bold mb-2">
                      {{ item.name }}
                    </h3>
                    <p class="text-body-2 text-grey-darken-1 mb-3">
                      {{ item.description }}
                    </p>

                    <div v-if="item.quantity > 0" class="mb-3">
                      <v-chip
                        size="x-small"
                        variant="outlined"
                        color="success"
                        class="ma-1"
                      >
                        {{ item.quantity }} available
                      </v-chip>
                    </div>

                    <div class="d-flex justify-space-between align-center">
                      <div class="text-h6 font-weight-bold text-success">
                        ${{ item.price.toFixed(2) }}
                      </div>
                      <v-btn
                        @click="addToCart(item)"
                        color="primary"
                        size="small"
                        rounded="lg"
                        prepend-icon="mdi-plus"
                        :disabled="item.quantity === 0"
                      >
                        {{ item.quantity === 0 ? "Out of Stock" : "Add" }}
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </div>
      </v-container>
    </div>

    <!-- Cart Summary (Fixed Bottom) -->
    <v-bottom-navigation v-if="cartItems.length > 0" class="d-flex">
      <v-container class="d-flex justify-space-between align-center py-2">
        <div>
          <div class="text-caption text-grey-darken-1">
            {{ cartItems.length }} items
          </div>
          <div class="text-h6 font-weight-bold">
            ${{ cartTotal.toFixed(2) }}
          </div>
        </div>
        <v-btn
          @click="viewCart"
          color="success"
          size="large"
          rounded="lg"
          prepend-icon="mdi-cart"
        >
          View Cart
        </v-btn>
      </v-container>
    </v-bottom-navigation>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";

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
const selectedCategory = ref<number | null>(null);
const cartItems = ref<MenuItem[]>([]);
const menuItems = ref<MenuItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Categories data (keeping static for now since they're not in the database)
const categories = ref<Category[]>([
  {
    id: 1,
    name: "All Items",
    description: "View all available menu items",
    icon: "mdi-food",
    color: "primary",
  },
]);

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

    menuItems.value = data || [];
  } catch (err) {
    console.error("Error fetching menu items:", err);
    error.value = "Failed to load menu items. Please try again later.";
  } finally {
    loading.value = false;
  }
};

// Computed properties
const bestSellers = computed(() => {
  // Get top 3 items by sales
  return menuItems.value
    .filter((item) => item.sales > 0)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);
});

const cartTotal = computed(() => {
  return cartItems.value.reduce((total, item) => total + item.price, 0);
});

// Methods
const getItemsByCategory = (categoryId: number) => {
  // Since we're showing all items, return all non-best-seller items
  const bestSellerIds = bestSellers.value.map((item) => item.id);
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
  // Set first category as default
  selectedCategory.value = categories.value[0]?.id || null;
  // Fetch menu items from Supabase
  await fetchMenuItems();
});
</script>
