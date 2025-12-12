<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useTheme } from "@/composables/useTheme";
import { useTableStore } from "@/stores/tableStores";
import {
  useOrderDataStore,
  type OrderWithMeals,
  type FeedbackData,
} from "@/stores/orderData";

import Navbar from "@/components/common/customer/Navbar.vue";
import StatusCard from "@/components/common/customer/StatusCard.vue";
import StatusMessages from "@/components/common/customer/StatusMessages.vue";
import StatusInfoCard from "@/components/common/customer/StatusInfoCard.vue";
import Feedback from "@/components/common/customer/Feedback.vue";

const router = useRouter();
const route = useRoute();

// Table store for managing table ID
const tableStore = useTableStore();

// Order data store for managing orders
const orderDataStore = useOrderDataStore();

// Theme setup
const { initializeTheme, primaryColor, secondaryColor, backgroundColor } =
  useTheme();

// Reactive data
const orderStatus = ref("pending");
const itemCount = ref(0);
const tableNumber = ref(1);
const currentOrder = ref<OrderWithMeals | null>(null);
const loading = ref(false);

// Animation states
const showContent = ref(false);
const pulseAnimation = ref(true);

// Feedback modal state
const showFeedbackModal = ref(false);
const feedbackSubmitted = ref(false);
const previousOrderStatus = ref("");

// Polling interval for status updates
let statusPollingInterval: number | null = null;

// Computed property to get table ID
const tableId = computed(() => {
  return tableStore.currentTableId || tableNumber.value;
});

// Computed property to determine current order status
const currentOrderStatus = computed(() => {
  return currentOrder.value?.status || "pending";
});

// Computed property for total item count
const totalItemCount = computed(() => {
  if (!currentOrder.value?.order_items_db) return itemCount.value;

  // Count total quantity from order_items
  return currentOrder.value.order_items_db.reduce(
    (total, item) => total + item.quantity,
    0
  );
});

// Convert order items to cart items format for StatusCard
const orderCartItems = computed(() => {
  if (!currentOrder.value?.order_items_db) return [];

  const cartItems: any[] = [];
  currentOrder.value.order_items_db.forEach(orderItem => {
    // Add multiple entries for quantity (to match cart format)
    for (let i = 0; i < orderItem.quantity; i++) {
      cartItems.push({
        id: orderItem.meal?.id || orderItem.id,
        name: orderItem.meal?.name || 'Unknown Item',
        price: orderItem.meal?.price || 0,
        image: orderItem.meal?.image || '/default-image.jpg'
      });
    }
  });

  return cartItems;
});

// Fetch latest order from database
const fetchOrders = async () => {
  try {
    loading.value = true;
    const currentTableId = tableId.value;
    console.log("Fetching latest order for table:", currentTableId);

    const fetchedOrder = await orderDataStore.getLatestOrderByTableWithMeals(
      currentTableId
    );
    currentOrder.value = fetchedOrder;

    console.log("Fetched latest order:", fetchedOrder);
    console.log("Current order status:", currentOrderStatus.value);

    // Check if status changed to completed
    if (
      currentOrderStatus.value === "completed" &&
      previousOrderStatus.value !== "completed"
    ) {
      // Note: Inventory and sales are already updated by completeOrderWithInventoryUpdate()
      // when the cashier marks the order as completed. No need to update here.
      console.log("Order completed! Inventory already updated by cashier.");

      // Show feedback modal if not already submitted
      if (!feedbackSubmitted.value) {
        setTimeout(() => {
          showFeedbackModal.value = true;
        }, 1000); // Show modal after 1 second delay for smooth transition
      }
    }

    // Update previous status for comparison
    previousOrderStatus.value = currentOrderStatus.value;

    // Update orderStatus for display
    orderStatus.value = currentOrderStatus.value;

    // If orders are ready or completed, show notification
    if (currentOrderStatus.value === "ready") {
      // Could show a toast notification here
      console.log("Order is ready!");
    }
  } catch (error) {
    console.error("Error fetching latest order:", error);
  } finally {
    loading.value = false;
  }
};

// Initialize component
onMounted(async () => {
  await initializeTheme();

  // Get table ID from store or route
  if (route.query.table) {
    const tableParam = route.query.table;
    const tableValue = Array.isArray(tableParam) ? tableParam[0] : tableParam;
    if (tableValue) {
      const parsedTableId = parseInt(tableValue, 10);
      if (!isNaN(parsedTableId) && parsedTableId > 0) {
        tableNumber.value = parsedTableId;
        tableStore.setTableId(parsedTableId);
      }
    }
  } else {
    tableNumber.value = tableId.value;
  }

  // Get item count from sessionStorage if available
  const storedOrderCount = sessionStorage.getItem("lastOrderItemCount");
  if (storedOrderCount) {
    itemCount.value = parseInt(storedOrderCount, 10) || 1;
  } else {
    itemCount.value = 1; // Default fallback
  }

  // Fetch initial orders
  await fetchOrders();

  // Set up polling for status updates every 10 seconds
  statusPollingInterval = setInterval(fetchOrders, 10000) as unknown as number;

  // Animate content appearance
  setTimeout(() => {
    showContent.value = true;
  }, 300);
});

// Clean up polling when component unmounts
onUnmounted(() => {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
  }
});

// Methods
const goBackToMenu = () => {
  router.push("/customer/menu");
};

const checkOrderStatus = async () => {
  // Manually refresh order status
  await fetchOrders();
};

// Handle feedback submission
const handleFeedbackSubmit = async (feedbackData: FeedbackData) => {
  try {
    console.log("Submitting feedback:", feedbackData);
    console.log("Order IDs to update:", feedbackData.orderIds);

    if (!feedbackData.orderIds || feedbackData.orderIds.length === 0) {
      console.error("No order IDs provided for feedback");
      alert("Error: No order found to submit feedback for.");
      return;
    }

    await orderDataStore.updateOrderFeedback(feedbackData);
    feedbackSubmitted.value = true;
    showFeedbackModal.value = false;

    // Show success message
    console.log("Feedback submitted successfully!");
    alert("Thank you for your feedback! It has been submitted successfully.");
  } catch (error) {
    console.error("Error submitting feedback:", error);
    alert(
      `Error submitting feedback: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Get order IDs for feedback
const getOrderIds = (): number[] => {
  return currentOrder.value?.id ? [currentOrder.value.id] : [];
};
</script>

<template>
  <v-app>
    <!-- Navigation Header -->
    <Navbar :page-title="'Order Placed'" />

    <!-- Content Area -->
    <v-main style="background-color: #f5f3ef">
      <v-container
        class="pa-2 d-flex flex-column"
        style="min-height: calc(100vh - 64px)"
      >
        <!-- Order Status Card -->
        <StatusCard
          :order-status="currentOrderStatus"
          :cart-items="orderCartItems"
          :table-id="tableId"
        />

        <!-- Main Waiting Content -->
        <div
          class="flex-grow-1 d-flex flex-column align-center justify-center text-center pa-4"
        >
          <!-- Loading State -->
          <div v-if="loading && !currentOrder" class="mb-6">
            <v-progress-circular
              :color="primaryColor"
              indeterminate
              size="64"
              class="mb-4"
            />
            <p class="text-body-1" :style="{ color: '#8B7355' }">
              Loading your order status...
            </p>
          </div>

          <!-- Content when not loading -->
          <template v-else>
            <!-- Waiting Animation/Image -->
            <div class="mb-6" :class="{ 'animate-fade-in': showContent }">
              <!-- Animated Cooking Icon -->
              <div
                class="position-relative mb-4"
                :class="{ 'animate-pulse': pulseAnimation }"
              >
                <v-avatar
                  size="120"
                  :style="{
                    backgroundColor: primaryColor + '20',
                    border: `3px solid ${primaryColor}`,
                  }"
                  class="mb-4"
                >
                  <v-icon size="60" :style="{ color: primaryColor }">
                    mdi-chef-hat
                  </v-icon>
                </v-avatar>

                <!-- Animated dots around the chef hat -->
                <div class="floating-dots">
                  <div
                    v-for="i in 3"
                    :key="i"
                    class="dot"
                    :style="{
                      backgroundColor: secondaryColor,
                      animationDelay: `${i * 0.3}s`,
                    }"
                  />
                </div>
              </div>
            </div>

            <!-- Status Messages Component -->
            <StatusMessages
              :order-status="currentOrderStatus"
              :table-id="tableId"
              :show-content="showContent"
            />

            <!-- Progress Indicator (only show if we have an order and it's not completed) -->
            <div
              v-if="currentOrder && currentOrderStatus !== 'completed'"
              class="mb-6 w-100"
              style="max-width: 300px"
            >
              <v-progress-linear
                :model-value="100"
                :color="primaryColor"
                height="8"
                rounded
                class="mb-2"
                indeterminate
              />
              <p class="text-caption text-center" :style="{ color: '#8B7355' }">
                Preparing your order...
              </p>
            </div>

            <!-- No Order State -->
            <div v-else class="mb-6">
              <p class="text-body-1 text-center" :style="{ color: '#8B7355' }">
                No active orders found for this table.
              </p>
              <v-btn
                @click="goBackToMenu"
                variant="outlined"
                size="large"
                rounded="pill"
                :style="{
                  borderColor: primaryColor,
                  color: primaryColor,
                }"
                class="mt-4"
              >
                Place an Order
              </v-btn>
            </div>

            <!-- Status Info Card Component (only show if we have an order and it's not completed) -->
            <StatusInfoCard
              v-if="currentOrder && currentOrderStatus !== 'completed'"
              :order-status="currentOrderStatus"
            />
          </template>
        </div>

        <!-- Action Buttons -->
        <div class="pa-2">
          <v-row class="align-center" no-gutters>
            <!-- Check Status Button -->
            <v-col cols="6" class="pr-1">
              <v-btn
                @click="checkOrderStatus"
                variant="outlined"
                size="large"
                rounded="pill"
                :style="{
                  borderColor: primaryColor,
                  color: primaryColor,
                }"
                :loading="loading"
                block
                class="text-body-2 font-weight-bold py-2"
              >
                <v-icon left class="mr-1" size="small">mdi-refresh</v-icon>
                CHECK STATUS
              </v-btn>
            </v-col>

            <!-- Back to Menu Button -->
            <v-col cols="6" class="pl-1">
              <v-btn
                @click="goBackToMenu"
                variant="flat"
                size="large"
                rounded="pill"
                :style="{ backgroundColor: primaryColor, color: 'white' }"
                block
                class="text-body-2 font-weight-bold py-2"
                elevation="2"
              >
                <v-icon left class="mr-1" size="small">mdi-silverware</v-icon>
                BACK TO MENU
              </v-btn>
            </v-col>
          </v-row>
        </div>
      </v-container>
    </v-main>

    <!-- Feedback Modal -->
    <Feedback
      v-model="showFeedbackModal"
      :order-ids="getOrderIds()"
      @submit-feedback="handleFeedbackSubmit"
    />
  </v-app>
</template>
