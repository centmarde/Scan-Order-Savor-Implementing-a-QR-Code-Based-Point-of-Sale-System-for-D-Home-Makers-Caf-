<script setup lang="ts">
import { ref, onMounted, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { APP_CONFIG } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";
import { useReviewOrder } from "@/composables/useReviewOrder";
import { useTableContext } from "@/pages/admin/composables/useTableContext";
import Navbar from "@/components/common/customer/Navbar.vue";
import StatusCard from "@/components/common/customer/StatusCard.vue";
import OrderItems from "@/components/common/customer/OrderItems.vue";

const router = useRouter();

// Theme setup
const { initializeTheme, primaryColor, secondaryColor, backgroundColor } =
  useTheme();

// Table context - CRITICAL for getting the actual table ID
const { tableId: contextTableId, getCurrentTableId } = useTableContext();

// Review Order composable
const {
  loading,
  loadingOrders,
  cartItems,
  ordersWithMeals,
  tableId,
  displayItems,
  displayTotal,
  itemCount,
  groupedCartItems,
  cartTotal,
  initializeTableId,
  loadCartData,
  fetchOrdersForTable,
  createOrder,
} = useReviewOrder();

// Local reactive data
const orderStatus = ref("pending");
const currentOrderId = ref<number | null>(null);

// Get cart data from router state if available and fetch existing orders
onMounted(async () => {
  await initializeTheme();

  // Initialize table ID and load cart data
  initializeTableId();
  loadCartData();

  // Fetch existing orders for this table
  await fetchOrdersForTable();
});

// Watch for changes in cart items and display items
// (console.log statements removed for production)

// Methods
const cancelOrder = () => {
  // Navigate back to menu
  router.push("/customer/menu");
};

const proceedToPayment = async () => {
  try {
    loading.value = true;

    // Only create new orders if we have cart items (new order)
    if (cartItems.value.length > 0) {
      // 🔥 CRITICAL FIX: Get the actual table ID from context
      const actualTableId = getCurrentTableId();

      // Prepare receipt data BEFORE creating order (before cart is cleared)
      const receiptData: any = {
        items: groupedCartItems.value.map((groupedItem) => ({
          id: groupedItem.item.id,
          name: groupedItem.item.name,
          price: groupedItem.item.price,
          quantity: groupedItem.quantity,
        })),
        total: cartTotal.value,
      };

      // Create order using composable with the ACTUAL table ID
      const order = await createOrder();

      if (order) {
        // Update local state
        orderStatus.value = "pending";

        // Add order ID to receipt data
        receiptData.id = order.id;

        // Store receipt data in sessionStorage for reliable transfer
        sessionStorage.setItem("receiptData", JSON.stringify(receiptData));

        // Navigate to receipt page with order data and table id
        router.push({
          path: "/customer/receipt",
          query: { table: actualTableId.toString() },
        });
      }
    } else {
      // If no cart items, just go to waiting page (existing orders)
      const actualTableId = getCurrentTableId();
      router.push({
        path: "/customer/waiting",
        query: { table: actualTableId.toString() },
      });
    }
  } catch (error) {
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
        <!-- Table Display -->
        <v-card v-if="contextTableId" class="mb-3" rounded="lg" elevation="1">
          <v-card-text class="pa-3 text-center">
            <v-chip color="primary">
              <v-icon start>mdi-table-furniture</v-icon>
              Table {{ contextTableId }}
            </v-chip>
          </v-card-text>
        </v-card>

        <!-- Order Status Card -->
       <!--  <StatusCard
          :order-status="orderStatus"
          :cart-items="cartItems"
          :table-id="contextTableId"
        /> -->

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
