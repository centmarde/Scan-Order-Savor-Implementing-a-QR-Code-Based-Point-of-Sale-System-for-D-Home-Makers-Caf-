<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from "vue";
import { useRouter, useRoute } from "vue-router";
import { APP_CONFIG } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";
import type { MenuItem } from "@/stores/menuData";
import {
  createOrdersWithMeals,
  getOrdersByTableWithMeals,
  calculateOrderTotal,
  type Order,
  type OrderWithMeals,
} from "@/services/orderService";

import Navbar from "@/components/common/customer/Navbar.vue";
import StatusCard from "@/components/common/customer/StatusCard.vue";

const router = useRouter();
const route = useRoute();

// Theme setup
const { initializeTheme, primaryColor, secondaryColor, backgroundColor } =
  useTheme();

// Reactive data
const loading = ref(false);
const loadingOrders = ref(false);
const orderStatus = ref("pending");
const currentOrderId = ref<number | null>(null);
const tableId = ref(1); // This should come from QR code

// Cart items (should be passed via router state or stored in a global store)
const cartItems = ref<MenuItem[]>([]);
// Orders with meal details from database
const ordersWithMeals = ref<OrderWithMeals[]>([]);

// Get cart data from router state if available and fetch existing orders
onMounted(async () => {
  await initializeTheme();

  console.log("=== ReviewOrder onMounted - Loading cart data ===");
  console.log("Route query:", route.query);
  console.log("Route meta:", route.meta);
  console.log("History state:", history.state);

  // Try multiple methods to get cart items
  let cartDataLoaded = false;

  // Method 1: Check sessionStorage for reviewOrderCartItems (primary)
  const storedCartItems = sessionStorage.getItem("reviewOrderCartItems");
  if (storedCartItems) {
    try {
      const parsed = JSON.parse(storedCartItems);
      console.log("Found cart data in reviewOrderCartItems:", parsed);
      cartItems.value = parsed;
      cartDataLoaded = true;
      // Clear from sessionStorage after use
      sessionStorage.removeItem("reviewOrderCartItems");
    } catch (error) {
      console.error("Error parsing reviewOrderCartItems:", error);
    }
  }

  // Method 2: Check sessionStorage for general cartItems (backup)
  if (!cartDataLoaded) {
    const generalCartItems = sessionStorage.getItem("cartItems");
    if (generalCartItems) {
      try {
        const parsed = JSON.parse(generalCartItems);
        console.log("Found cart data in cartItems:", parsed);
        cartItems.value = parsed;
        cartDataLoaded = true;
        // Don't clear this one as it might be used elsewhere
      } catch (error) {
        console.error("Error parsing cartItems:", error);
      }
    }
  }

  // Method 3: Check route meta (fallback)
  if (!cartDataLoaded && route.meta?.cartItems) {
    console.log("Found cart data in route meta:", route.meta.cartItems);
    cartItems.value = route.meta.cartItems as MenuItem[];
    cartDataLoaded = true;
  }

  // Method 4: Check history state (fallback)
  if (!cartDataLoaded && history.state?.cartItems) {
    console.log("Found cart data in history state:", history.state.cartItems);
    cartItems.value = history.state.cartItems;
    cartDataLoaded = true;
  }

  console.log("Final cart items loaded:", cartItems.value);
  console.log("Cart data loaded successfully:", cartDataLoaded);

  // Fetch existing orders for this table
  await fetchOrdersForTable();
});

// Computed properties
const groupedCartItems = computed(() => {
  const grouped: { [key: number]: { item: MenuItem; quantity: number } } = {};

  cartItems.value.forEach((item) => {
    if (grouped[item.id]) {
      grouped[item.id].quantity += 1;
    } else {
      grouped[item.id] = { item, quantity: 1 };
    }
  });

  return Object.values(grouped);
});

const groupedOrderItems = computed(() => {
  const grouped: { [key: number]: { item: MenuItem; quantity: number } } = {};

  ordersWithMeals.value.forEach((order) => {
    if (order.meal) {
      if (grouped[order.meal.id]) {
        grouped[order.meal.id].quantity += 1;
      } else {
        grouped[order.meal.id] = { item: order.meal, quantity: 1 };
      }
    }
  });

  return Object.values(grouped);
});

const displayItems = computed(() => {
  // Show cart items if available (new order), otherwise show database orders
  const hasCartItems = cartItems.value.length > 0;
  const hasOrderItems = groupedOrderItems.value.length > 0;

  console.log(
    "Display items - Cart items:",
    cartItems.value.length,
    "Order items:",
    groupedOrderItems.value.length
  );

  if (hasCartItems) {
    console.log("Displaying cart items:", groupedCartItems.value);
    return groupedCartItems.value;
  } else if (hasOrderItems) {
    console.log("Displaying order items:", groupedOrderItems.value);
    return groupedOrderItems.value;
  }

  return [];
});

const orderTotal = computed(() => {
  return ordersWithMeals.value.reduce(
    (total: number, order: OrderWithMeals) => total + (order.total_amount || 0),
    0
  );
});

const cartTotal = computed(() => {
  return cartItems.value.reduce(
    (total: number, item: MenuItem) => total + item.price,
    0
  );
});

const displayTotal = computed(() => {
  return cartItems.value.length > 0 ? cartTotal.value : orderTotal.value;
});

const itemCount = computed(() => {
  return cartItems.value.length > 0
    ? cartItems.value.length
    : ordersWithMeals.value.length;
});

// Watch for changes in cart items and display items
watchEffect(() => {
  console.log("Cart items changed:", cartItems.value);
  console.log("Display items changed:", displayItems.value);
  console.log("Display total:", displayTotal.value);
});

// Methods
const fetchOrdersForTable = async () => {
  try {
    loadingOrders.value = true;
    const orders = await getOrdersByTableWithMeals(tableId.value);
    ordersWithMeals.value = orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
  } finally {
    loadingOrders.value = false;
  }
};

const cancelOrder = () => {
  // Navigate back to menu
  router.push("/customer/menu");
};

const proceedToPayment = async () => {
  try {
    loading.value = true;

    // Only create new orders if we have cart items (new order)
    if (cartItems.value.length > 0) {
      // Create orders with meal_id for each cart item
      const orders = await createOrdersWithMeals(
        cartItems.value,
        tableId.value
      );
      console.log("Orders created:", orders);

      // Clear cart items after successful order creation
      cartItems.value = [];

      // Update local state
      orderStatus.value = "pending";

      // Refresh the orders list to show the new orders
      await fetchOrdersForTable();
    }

    // For now, just show success message and go back to menu
    alert("Order placed successfully! You will be redirected to the menu.");
    router.push("/customer/menu");
  } catch (error) {
    console.error("Error processing order:", error);
    // TODO: Show error toast or message to user
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-app>
    <!-- Navigation Header -->
    <Navbar :page-title="'Orders'" />

    <!-- Content Area -->
    <v-main style="background-color: #f5f3ef">
      <v-container class="pa-2">
        <!-- Order Status Card -->
        <StatusCard :order-status="orderStatus" :item-count="itemCount" />

        <!-- Order Items List -->
        <v-card
          class="mb-3"
          elevation="2"
          rounded="lg"
          :style="{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid rgba(139, 92, 42, 0.1)',
          }"
        >
          <v-card-text class="pa-3">
            <h3
              class="text-subtitle-1 font-weight-bold mb-2"
              :style="{ color: '#2D2D2D' }"
            >
              Ordered Items
            </h3>

            <!-- Loading State -->
            <div v-if="loadingOrders" class="text-center py-4">
              <v-progress-circular
                indeterminate
                color="primary"
                size="24"
                class="mb-2"
              ></v-progress-circular>
              <p class="text-caption text-grey-darken-1">
                Loading your orders...
              </p>
            </div>

            <v-list v-else class="pa-0" style="background: transparent">
              <v-list-item
                v-for="groupedItem in displayItems"
                :key="groupedItem.item.id"
                class="px-0 py-2 mb-2"
                :style="{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                }"
              >
                <template v-slot:prepend>
                  <div class="position-relative mr-3 ml-2">
                    <v-avatar
                      size="48"
                      class="elevation-1"
                      :style="{
                        border: '1px solid #ffffff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                      }"
                    >
                      <v-img
                        :src="groupedItem.item.image"
                        :alt="groupedItem.item.name"
                        cover
                      />
                    </v-avatar>
                    <v-chip
                      v-if="groupedItem.quantity > 1"
                      size="x-small"
                      class="position-absolute"
                      :style="{
                        top: '-3px',
                        right: '-3px',
                        backgroundColor: primaryColor,
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold',
                      }"
                    >
                      {{ groupedItem.quantity }}x
                    </v-chip>
                  </div>
                </template>

                <v-list-item-content class="py-1">
                  <v-list-item-title
                    class="text-body-1 font-weight-bold mb-1"
                    :style="{ color: '#2D2D2D' }"
                  >
                    {{ groupedItem.item.name }}
                    <span
                      v-if="groupedItem.quantity > 1"
                      class="text-caption ml-1"
                      :style="{ color: primaryColor, fontWeight: 'bold' }"
                    >
                      ({{ groupedItem.quantity }}x)
                    </span>
                  </v-list-item-title>

                  <v-list-item-subtitle
                    class="text-caption mb-1"
                    :style="{ color: '#666' }"
                  >
                    {{
                      groupedItem.item.description ||
                      "Delicious meal prepared with care"
                    }}
                  </v-list-item-subtitle>

                  <div class="d-flex align-center justify-space-between">
                    <span
                      class="text-caption font-weight-medium"
                      :style="{ color: primaryColor }"
                    >
                      {{ APP_CONFIG.CURRENCY
                      }}{{ groupedItem.item.price.toFixed(2) }} each
                    </span>
                    <span
                      class="text-caption font-weight-bold mr-2"
                      :style="{ color: primaryColor }"
                    >
                      {{ groupedItem.quantity }}x
                    </span>
                  </div>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Order Total Card -->
        <v-card
          class="mb-3"
          elevation="3"
          rounded="lg"
          :style="{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }"
        >
          <v-card-text class="pa-3 text-center">
            <h2 class="text-h6 font-weight-bold text-white mb-1">
              Order Total
            </h2>
            <p class="text-h5 font-weight-bold text-white mb-0">
              {{ APP_CONFIG.CURRENCY }}{{ displayTotal.toFixed(2) }}
            </p>
          </v-card-text>
        </v-card>
      </v-container>

      <!-- Bottom Action Buttons -->
      <div
        class="position-fixed pa-2"
        style="bottom: 0; left: 0; right: 0; z-index: 10; background: #f5f3ef"
      >
        <v-row class="align-center" no-gutters>
          <!-- Cancel Button -->
          <v-col cols="5">
            <v-btn
              @click="cancelOrder"
              variant="outlined"
              size="large"
              rounded="pill"
              color="error"
              block
              class="text-body-2 font-weight-bold py-2"
              :disabled="loading"
            >
              <v-icon left class="mr-1" size="small">mdi-close</v-icon>
              CANCEL
            </v-btn>
          </v-col>

          <v-col cols="2" class="text-center">
            <v-divider vertical class="mx-auto" style="height: 32px" />
          </v-col>

          <!-- Proceed to Payment Button -->
          <v-col cols="5">
            <v-btn
              @click="proceedToPayment"
              variant="flat"
              size="large"
              rounded="pill"
              :style="{ backgroundColor: primaryColor, color: 'white' }"
              block
              class="text-body-2 font-weight-bold py-2"
              elevation="2"
              :loading="loading"
              :disabled="cartItems.length === 0 && ordersWithMeals.length === 0"
            >
              <v-icon left class="mr-1" size="small">
                {{
                  cartItems.length > 0 ? "mdi-cart-check" : "mdi-credit-card"
                }}
              </v-icon>
              {{ cartItems.length > 0 ? "PLACE ORDER" : "PROCEED TO PAYMENT" }}
            </v-btn>
          </v-col>
        </v-row>
      </div>

      <!-- Empty State -->
      <v-container
        v-if="displayItems.length === 0 && !loadingOrders"
        class="text-center pa-4"
      >
        <v-icon color="grey-lighten-1" size="48" class="mb-3"
          >mdi-cart-off</v-icon
        >
        <h3 class="text-h6 text-grey-darken-1 mb-3">No Items to Review</h3>
        <p class="text-body-2 text-grey-darken-1 mb-4">
          Your cart is empty. Please add some items to your order first.
        </p>
        <v-btn
          @click="() => router.push('/customer/menu')"
          color="primary"
          variant="flat"
          rounded="lg"
          size="default"
          class="px-6"
        >
          Back to Menu
        </v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>
