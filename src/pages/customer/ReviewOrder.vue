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

  // Get cart items from multiple sources (for new orders)
  if (route.meta?.cartItems) {
    cartItems.value = route.meta.cartItems as MenuItem[];
  } else if (history.state?.cartItems) {
    cartItems.value = history.state.cartItems;
  } else {
    // Try to get from sessionStorage as backup
    const storedCartItems = sessionStorage.getItem("reviewOrderCartItems");
    if (storedCartItems) {
      try {
        cartItems.value = JSON.parse(storedCartItems);
        // Clear from sessionStorage after use
        sessionStorage.removeItem("reviewOrderCartItems");
      } catch (error) {
        console.error("Error parsing stored cart items:", error);
      }
    }
  }

  console.log("Cart items loaded:", cartItems.value);

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "#FFA726";
    case "confirmed":
      return "#42A5F5";
    case "preparing":
      return "#FF7043";
    case "ready":
      return "#66BB6A";
    case "completed":
      return "#4CAF50";
    case "cancelled":
      return "#EF5350";
    default:
      return primaryColor.value;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "preparing":
      return "Preparing";
    case "ready":
      return "Ready";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Unknown";
  }
};

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

    // Navigate to payment or confirmation page
    router.push({
      path: "/customer/payment",
      query: { tableId: tableId.value.toString() },
    });
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
      <v-container class="pa-4">
        <!-- Order Status Card -->
        <v-card
          class="mb-6"
          elevation="4"
          rounded="xl"
          :style="{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid rgba(139, 92, 42, 0.1)',
          }"
        >
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="d-flex align-center">
                <v-icon :style="{ color: primaryColor }" size="24" class="mr-2">
                  mdi-receipt
                </v-icon>
                <h2
                  class="text-h5 font-weight-bold"
                  :style="{ color: '#2D2D2D' }"
                >
                  Review Your Order
                </h2>
              </div>

              <!-- Order Status -->
              <v-chip
                size="default"
                variant="flat"
                :style="{
                  backgroundColor: getStatusColor(orderStatus),
                  color: 'white',
                }"
                class="font-weight-bold"
              >
                <v-icon left size="16" class="mr-1">
                  {{
                    orderStatus === "pending"
                      ? "mdi-clock-outline"
                      : orderStatus === "confirmed"
                      ? "mdi-check-circle"
                      : orderStatus === "preparing"
                      ? "mdi-chef-hat"
                      : orderStatus === "ready"
                      ? "mdi-bell-ring"
                      : orderStatus === "completed"
                      ? "mdi-check-all"
                      : "mdi-close-circle"
                  }}
                </v-icon>
                {{ getStatusText(orderStatus) }}
              </v-chip>
            </div>

            <!-- Order Summary Info -->
            <div class="d-flex align-center mb-4">
              <v-chip
                size="small"
                variant="flat"
                :style="{ backgroundColor: primaryColor, color: 'white' }"
                class="mr-3"
              >
                {{ itemCount }} item{{ itemCount > 1 ? "s" : "" }}
              </v-chip>
              <span class="text-body-2" :style="{ color: '#555' }">
                Total: {{ APP_CONFIG.CURRENCY }}{{ displayTotal.toFixed(2) }}
              </span>
            </div>
          </v-card-text>
        </v-card>

        <!-- Order Items List -->
        <v-card
          class="mb-6"
          elevation="4"
          rounded="xl"
          :style="{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid rgba(139, 92, 42, 0.1)',
          }"
        >
          <v-card-text class="pa-5">
            <h3
              class="text-h6 font-weight-bold mb-4"
              :style="{ color: '#2D2D2D' }"
            >
              Ordered Items
            </h3>

            <!-- Loading State -->
            <div v-if="loadingOrders" class="text-center py-8">
              <v-progress-circular
                indeterminate
                color="primary"
                size="32"
                class="mb-3"
              ></v-progress-circular>
              <p class="text-body-2 text-grey-darken-1">
                Loading your orders...
              </p>
            </div>

            <v-list v-else class="pa-0" style="background: transparent">
              <v-list-item
                v-for="groupedItem in displayItems"
                :key="groupedItem.item.id"
                class="px-0 py-3 mb-3"
                :style="{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e9ecef',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }"
              >
                <template v-slot:prepend>
                  <div class="position-relative mr-4 ml-3">
                    <v-avatar
                      size="60"
                      class="elevation-2"
                      :style="{
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
                      size="small"
                      class="position-absolute"
                      :style="{
                        top: '-5px',
                        right: '-5px',
                        backgroundColor: primaryColor,
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }"
                    >
                      {{ groupedItem.quantity }}x
                    </v-chip>
                  </div>
                </template>

                <v-list-item-content class="py-2">
                  <v-list-item-title
                    class="text-h6 font-weight-bold mb-2"
                    :style="{ color: '#2D2D2D' }"
                  >
                    {{ groupedItem.item.name }}
                    <span
                      v-if="groupedItem.quantity > 1"
                      class="text-body-2 ml-2"
                      :style="{ color: primaryColor, fontWeight: 'bold' }"
                    >
                      ({{ groupedItem.quantity }}x)
                    </span>
                  </v-list-item-title>

                  <v-list-item-subtitle
                    class="text-body-2 mb-2"
                    :style="{ color: '#666' }"
                  >
                    {{
                      groupedItem.item.description ||
                      "Delicious meal prepared with care"
                    }}
                  </v-list-item-subtitle>

                  <div class="d-flex align-center justify-space-between">
                    <span
                      class="text-body-2 font-weight-medium"
                      :style="{ color: primaryColor }"
                    >
                      {{ APP_CONFIG.CURRENCY
                      }}{{ groupedItem.item.price.toFixed(2) }} each
                    </span>
                    <span
                      class="text-h6 font-weight-bold"
                      :style="{ color: primaryColor }"
                    >
                      {{ APP_CONFIG.CURRENCY
                      }}{{
                        (groupedItem.item.price * groupedItem.quantity).toFixed(
                          2
                        )
                      }}
                    </span>
                  </div>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Order Total Card -->
        <v-card
          class="mb-6"
          elevation="6"
          rounded="xl"
          :style="{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }"
        >
          <v-card-text class="pa-5 text-center">
            <h2 class="text-h4 font-weight-bold text-white mb-2">
              Order Total
            </h2>
            <p class="text-h3 font-weight-bold text-white mb-0">
              {{ APP_CONFIG.CURRENCY }}{{ displayTotal.toFixed(2) }}
            </p>
          </v-card-text>
        </v-card>
      </v-container>

      <!-- Bottom Action Buttons -->
      <div
        class="position-fixed pa-4"
        style="bottom: 0; left: 0; right: 0; z-index: 10; background: #f5f3ef"
      >
        <v-row class="align-center" no-gutters>
          <!-- Cancel Button -->
          <v-col cols="5">
            <v-btn
              @click="cancelOrder"
              variant="outlined"
              size="x-large"
              rounded="pill"
              color="error"
              block
              class="text-body-1 font-weight-bold py-3"
              :disabled="loading"
            >
              <v-icon left class="mr-2">mdi-close</v-icon>
              CANCEL
            </v-btn>
          </v-col>

          <v-col cols="2" class="text-center">
            <v-divider vertical class="mx-auto" style="height: 40px" />
          </v-col>

          <!-- Proceed to Payment Button -->
          <v-col cols="5">
            <v-btn
              @click="proceedToPayment"
              variant="flat"
              size="x-large"
              rounded="pill"
              :style="{ backgroundColor: primaryColor, color: 'white' }"
              block
              class="text-body-1 font-weight-bold py-3"
              elevation="4"
              :loading="loading"
              :disabled="cartItems.length === 0 && ordersWithMeals.length === 0"
            >
              <v-icon left class="mr-2">
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
        class="text-center pa-8"
      >
        <v-icon color="grey-lighten-1" size="64" class="mb-4"
          >mdi-cart-off</v-icon
        >
        <h3 class="text-h5 text-grey-darken-1 mb-4">No Items to Review</h3>
        <p class="text-body-1 text-grey-darken-1 mb-6">
          Your cart is empty. Please add some items to your order first.
        </p>
        <v-btn
          @click="() => router.push('/customer/menu')"
          color="primary"
          variant="flat"
          rounded="xl"
          size="large"
          class="px-8"
        >
          Back to Menu
        </v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>
