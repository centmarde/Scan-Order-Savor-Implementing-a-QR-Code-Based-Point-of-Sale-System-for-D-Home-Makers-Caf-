<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from "vue";
import { useRouter, useRoute } from "vue-router";
import { APP_CONFIG } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";
import { useTableStore } from "@/stores/tableStores";
import type { MenuItem } from "@/stores/menuData";
import {
  useOrderDataStore,
  type Order,
  type OrderWithMeals,
} from "@/stores/orderData";

import Navbar from "@/components/common/customer/Navbar.vue";
import StatusCard from "@/components/common/customer/StatusCard.vue";
import OrderItems from "@/components/common/customer/OrderItems.vue";

const router = useRouter();
const route = useRoute();

// Table store for managing table ID from QR code
const tableStore = useTableStore();

// Order data store for managing orders
const orderDataStore = useOrderDataStore();

// Theme setup
const { initializeTheme, primaryColor, secondaryColor, backgroundColor } =
  useTheme();

// Reactive data
const loading = ref(false);
const loadingOrders = ref(false);
const orderStatus = ref("pending");
const currentOrderId = ref<number | null>(null);

// Cart items (should be passed via router state or stored in a global store)
const cartItems = ref<MenuItem[]>([]);
// Orders with meal details from database
const ordersWithMeals = ref<OrderWithMeals[]>([]);

// Computed property to get table ID from store with fallback
const tableId = computed(() => {
  return tableStore.currentTableId || 1; // Default to table 1 if no table ID is set
});

// Get cart data from router state if available and fetch existing orders
onMounted(async () => {
  await initializeTheme();

  console.log("=== ReviewOrder onMounted - Loading cart data ===");
  console.log("Route query:", route.query);
  console.log("Route meta:", route.meta);
  console.log("History state:", history.state);

  // Ensure table ID is set from query params if available (fallback for direct navigation)
  if (route.query.table && !tableStore.currentTableId) {
    const tableParam = route.query.table;
    const tableValue = Array.isArray(tableParam) ? tableParam[0] : tableParam;
    if (tableValue) {
      const parsedTableId = parseInt(tableValue, 10);
      if (!isNaN(parsedTableId) && parsedTableId > 0) {
        tableStore.setTableId(parsedTableId);
        console.log("Table ID set from query params:", parsedTableId);
      }
    }
  }

  console.log("Current table ID for orders:", tableId.value);

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
    const currentTableId = tableId.value;
    console.log("Fetching orders for table:", currentTableId);
    const orders = await orderDataStore.getOrdersByTableWithMeals(
      currentTableId
    );
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
      const currentTableId = tableId.value;
      console.log(
        "Creating orders for table:",
        currentTableId,
        "with items:",
        cartItems.value
      );

      // Store item count for the waiting page
      sessionStorage.setItem(
        "lastOrderItemCount",
        cartItems.value.length.toString()
      );

      // Create single order with order_items table
      const order = await orderDataStore.createOrderWithItems(
        cartItems.value,
        currentTableId
      );
      console.log("Order created successfully:", order);

      // Clear cart items after successful order creation
      cartItems.value = [];

      // Update local state
      orderStatus.value = "pending";

      // Refresh the orders list to show the new orders
      await fetchOrdersForTable();

      // Navigate to waiting page with table information
      router.push({
        path: "/customer/waiting",
        query: { table: currentTableId.toString() },
      });
    } else {
      // If no cart items, just go to waiting page (existing orders)
      router.push({
        path: "/customer/waiting",
        query: { table: tableId.value.toString() },
      });
    }
  } catch (error) {
    console.error("Error processing order:", error);
    // Show error message and stay on current page
    alert("There was an error placing your order. Please try again.");
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
        <OrderItems
          :display-items="displayItems"
          :loading-orders="loadingOrders"
        />

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
