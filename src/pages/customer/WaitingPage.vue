<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useTheme } from "@/composables/useTheme";
import { useTableStore } from "@/stores/tableStores";
import {
  getOrdersByTableWithMeals,
  type OrderWithMeals,
} from "@/services/orderService";

import Navbar from "@/components/common/customer/Navbar.vue";
import StatusCard from "@/components/common/customer/StatusCard.vue";

const router = useRouter();
const route = useRoute();

// Table store for managing table ID
const tableStore = useTableStore();

// Theme setup
const { initializeTheme, primaryColor, secondaryColor, backgroundColor } =
  useTheme();

// Reactive data
const orderStatus = ref("pending");
const itemCount = ref(0);
const tableNumber = ref(1);
const orders = ref<OrderWithMeals[]>([]);
const loading = ref(false);

// Animation states
const showContent = ref(false);
const pulseAnimation = ref(true);

// Polling interval for status updates
let statusPollingInterval: number | null = null;

// Computed property to get table ID
const tableId = computed(() => {
  return tableStore.currentTableId || tableNumber.value;
});

// Computed property to determine current order status
const currentOrderStatus = computed(() => {
  if (orders.value.length === 0) return "pending";

  // Get the most recent order status or determine overall status
  const statuses = orders.value.map((order) => order.status);

  // Priority order for determining overall status
  if (statuses.includes("cancelled")) return "cancelled";
  if (statuses.includes("completed")) return "completed";
  if (statuses.includes("ready")) return "ready";
  if (statuses.includes("preparing")) return "preparing";
  if (statuses.includes("confirmed")) return "confirmed";
  if (statuses.includes("pending")) return "pending";

  return "pending";
});

// Computed property for total item count
const totalItemCount = computed(() => {
  return orders.value.length || itemCount.value;
});

// Fetch orders from database
const fetchOrders = async () => {
  try {
    loading.value = true;
    const currentTableId = tableId.value;
    console.log("Fetching orders for table:", currentTableId);

    const fetchedOrders = await getOrdersByTableWithMeals(currentTableId);
    orders.value = fetchedOrders;

    console.log("Fetched orders:", fetchedOrders);
    console.log("Current order status:", currentOrderStatus.value);

    // Update orderStatus for display
    orderStatus.value = currentOrderStatus.value;

    // If orders are ready or completed, show notification
    if (currentOrderStatus.value === "ready") {
      // Could show a toast notification here
      console.log("Order is ready!");
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
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

  // Auto-redirect to menu after 5 minutes (extended time)
  setTimeout(() => {
    router.push("/customer/menu");
  }, 300000);
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
          :item-count="totalItemCount"
        />

        <!-- Main Waiting Content -->
        <div
          class="flex-grow-1 d-flex flex-column align-center justify-center text-center pa-4"
        >
          <!-- Loading State -->
          <div v-if="loading && orders.length === 0" class="mb-6">
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

            <!-- Dynamic Messages Based on Status -->
            <div
              class="mb-6"
              :class="{ 'animate-fade-in-delayed': showContent }"
            >
              <!-- Pending Status -->
              <div v-if="currentOrderStatus === 'pending'">
                <h2
                  class="text-h5 font-weight-bold mb-3"
                  :style="{ color: primaryColor }"
                >
                  Order Received
                </h2>
                <p class="text-h6 mb-4" :style="{ color: '#5D4E37' }">
                  We're reviewing your order
                </p>
                <p
                  class="text-body-1 mb-2 px-4"
                  :style="{ color: '#8B7355', lineHeight: '1.6' }"
                >
                  Your order has been successfully placed and is being reviewed
                  by our kitchen team.
                </p>
                <p
                  class="text-body-1 mb-4 px-4"
                  :style="{ color: '#8B7355', lineHeight: '1.6' }"
                >
                  Please sit back and relax while we confirm your order details.
                </p>
              </div>

              <!-- Confirmed Status -->
              <div v-else-if="currentOrderStatus === 'confirmed'">
                <h2
                  class="text-h5 font-weight-bold mb-3"
                  :style="{ color: primaryColor }"
                >
                  Order Confirmed
                </h2>
                <p class="text-h6 mb-4" :style="{ color: '#5D4E37' }">
                  We're getting started on your meal
                </p>
                <p
                  class="text-body-1 mb-2 px-4"
                  :style="{ color: '#8B7355', lineHeight: '1.6' }"
                >
                  Great news! Your order has been confirmed and our chefs are
                  preparing to cook.
                </p>
                <p
                  class="text-body-1 mb-4 px-4"
                  :style="{ color: '#8B7355', lineHeight: '1.6' }"
                >
                  Your delicious meal will be ready soon. Thank you for your
                  patience!
                </p>
              </div>

              <!-- Preparing Status -->
              <div v-else-if="currentOrderStatus === 'preparing'">
                <h2
                  class="text-h5 font-weight-bold mb-3"
                  :style="{ color: primaryColor }"
                >
                  Your Order is Being Prepared
                </h2>
                <p class="text-h6 mb-4" :style="{ color: '#5D4E37' }">
                  Our chefs are cooking your meal
                </p>
                <p
                  class="text-body-1 mb-2 px-4"
                  :style="{ color: '#8B7355', lineHeight: '1.6' }"
                >
                  Our talented chefs are carefully crafting your delicious meal
                  with fresh ingredients.
                </p>
                <p
                  class="text-body-1 mb-4 px-4"
                  :style="{ color: '#8B7355', lineHeight: '1.6' }"
                >
                  Your order will arrive momentarily. Thank you for your
                  patience!
                </p>
              </div>

              <!-- Ready Status -->
              <div v-else-if="currentOrderStatus === 'ready'">
                <h2
                  class="text-h5 font-weight-bold mb-3"
                  :style="{ color: '#4CAF50' }"
                >
                  Your Order is Ready!
                </h2>
                <p class="text-h6 mb-4" :style="{ color: '#2E7D32' }">
                  Please wait for our staff
                </p>
                <p
                  class="text-body-1 mb-2 px-4"
                  :style="{ color: '#388E3C', lineHeight: '1.6' }"
                >
                  Excellent! Your order has been prepared and is ready to be
                  served.
                </p>
                <p
                  class="text-body-1 mb-4 px-4"
                  :style="{ color: '#388E3C', lineHeight: '1.6' }"
                >
                  Our staff will bring your meal to your table shortly. Enjoy
                  your dining experience!
                </p>
              </div>

              <!-- Completed Status -->
              <div v-else-if="currentOrderStatus === 'completed'">
                <h2
                  class="text-h5 font-weight-bold mb-3"
                  :style="{ color: '#4CAF50' }"
                >
                  Order Completed
                </h2>
                <p class="text-h6 mb-4" :style="{ color: '#2E7D32' }">
                  Thank you for dining with us!
                </p>
                <p
                  class="text-body-1 mb-2 px-4"
                  :style="{ color: '#388E3C', lineHeight: '1.6' }"
                >
                  Your order has been served. We hope you enjoyed your meal!
                </p>
                <p
                  class="text-body-1 mb-4 px-4"
                  :style="{ color: '#388E3C', lineHeight: '1.6' }"
                >
                  Thank you for choosing D'Home Makers Café. We look forward to
                  serving you again.
                </p>
              </div>

              <!-- Cancelled Status -->
              <div v-else-if="currentOrderStatus === 'cancelled'">
                <h2
                  class="text-h5 font-weight-bold mb-3"
                  :style="{ color: '#F44336' }"
                >
                  Order Cancelled
                </h2>
                <p class="text-h6 mb-4" :style="{ color: '#C62828' }">
                  We apologize for any inconvenience
                </p>
                <p
                  class="text-body-1 mb-2 px-4"
                  :style="{ color: '#D32F2F', lineHeight: '1.6' }"
                >
                  Your order has been cancelled. If this was unexpected, please
                  contact our staff.
                </p>
                <p
                  class="text-body-1 mb-4 px-4"
                  :style="{ color: '#D32F2F', lineHeight: '1.6' }"
                >
                  We're here to help resolve any issues you may have
                  experienced.
                </p>
              </div>

              <!-- Table Information -->
              <v-chip
                size="default"
                variant="flat"
                :style="{
                  backgroundColor: primaryColor + '20',
                  color: primaryColor,
                  border: `1px solid ${primaryColor}40`,
                }"
                class="font-weight-bold"
              >
                <v-icon left size="16" class="mr-1">mdi-table-furniture</v-icon>
                Table {{ tableId }}
              </v-chip>
            </div>

            <!-- Progress Indicator -->
            <div class="mb-6 w-100" style="max-width: 300px">
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

            <!-- Dynamic Status Info Card -->
            <v-card
              elevation="2"
              rounded="xl"
              class="pa-4 mb-4"
              :style="{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '1px solid rgba(139, 92, 42, 0.1)',
                maxWidth: '280px',
              }"
            >
              <div class="text-center">
                <!-- Dynamic Icon and Info based on Status -->
                <div v-if="currentOrderStatus === 'pending'">
                  <v-icon :style="{ color: '#FFA726' }" size="24" class="mb-2">
                    mdi-clock-outline
                  </v-icon>
                  <p
                    class="text-body-2 font-weight-medium mb-1"
                    :style="{ color: primaryColor }"
                  >
                    Estimated Time
                  </p>
                  <p
                    class="text-h6 font-weight-bold"
                    :style="{ color: '#2D2D2D' }"
                  >
                    3-5 minutes
                  </p>
                </div>

                <div v-else-if="currentOrderStatus === 'confirmed'">
                  <v-icon :style="{ color: '#42A5F5' }" size="24" class="mb-2">
                    mdi-check-circle-outline
                  </v-icon>
                  <p
                    class="text-body-2 font-weight-medium mb-1"
                    :style="{ color: primaryColor }"
                  >
                    Estimated Time
                  </p>
                  <p
                    class="text-h6 font-weight-bold"
                    :style="{ color: '#2D2D2D' }"
                  >
                    12-15 minutes
                  </p>
                </div>

                <div v-else-if="currentOrderStatus === 'preparing'">
                  <v-icon :style="{ color: '#FF7043' }" size="24" class="mb-2">
                    mdi-chef-hat
                  </v-icon>
                  <p
                    class="text-body-2 font-weight-medium mb-1"
                    :style="{ color: primaryColor }"
                  >
                    Estimated Time
                  </p>
                  <p
                    class="text-h6 font-weight-bold"
                    :style="{ color: '#2D2D2D' }"
                  >
                    5-10 minutes
                  </p>
                </div>

                <div v-else-if="currentOrderStatus === 'ready'">
                  <v-icon :style="{ color: '#4CAF50' }" size="24" class="mb-2">
                    mdi-bell-ring
                  </v-icon>
                  <p
                    class="text-body-2 font-weight-medium mb-1"
                    :style="{ color: '#4CAF50' }"
                  >
                    Status
                  </p>
                  <p
                    class="text-h6 font-weight-bold"
                    :style="{ color: '#2D2D2D' }"
                  >
                    Ready to Serve!
                  </p>
                </div>

                <div v-else-if="currentOrderStatus === 'completed'">
                  <v-icon :style="{ color: '#4CAF50' }" size="24" class="mb-2">
                    mdi-check-all
                  </v-icon>
                  <p
                    class="text-body-2 font-weight-medium mb-1"
                    :style="{ color: '#4CAF50' }"
                  >
                    Status
                  </p>
                  <p
                    class="text-h6 font-weight-bold"
                    :style="{ color: '#2D2D2D' }"
                  >
                    Completed
                  </p>
                </div>

                <div v-else-if="currentOrderStatus === 'cancelled'">
                  <v-icon :style="{ color: '#F44336' }" size="24" class="mb-2">
                    mdi-close-circle-outline
                  </v-icon>
                  <p
                    class="text-body-2 font-weight-medium mb-1"
                    :style="{ color: '#F44336' }"
                  >
                    Status
                  </p>
                  <p
                    class="text-h6 font-weight-bold"
                    :style="{ color: '#2D2D2D' }"
                  >
                    Cancelled
                  </p>
                </div>
              </div>
            </v-card>
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
  </v-app>
</template>

<style scoped>
/* Fade in animations */
.animate-fade-in {
  animation: fadeIn 0.8s ease-in-out;
}

.animate-fade-in-delayed {
  animation: fadeIn 1.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulse animation for chef hat */
.animate-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Floating dots animation */
.floating-dots {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 160px;
  height: 160px;
  pointer-events: none;
}

.dot {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: float 3s infinite ease-in-out;
}

.dot:nth-child(1) {
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
}

.dot:nth-child(2) {
  top: 50%;
  right: 20%;
  transform: translateY(-50%);
}

.dot:nth-child(3) {
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
}

@keyframes float {
  0%,
  100% {
    opacity: 0.3;
    transform: translateY(0px) translateX(-50%);
  }
  50% {
    opacity: 1;
    transform: translateY(-10px) translateX(-50%);
  }
}

.dot:nth-child(2) {
  animation-name: floatRight;
}

@keyframes floatRight {
  0%,
  100% {
    opacity: 0.3;
    transform: translateX(0px) translateY(-50%);
  }
  50% {
    opacity: 1;
    transform: translateX(10px) translateY(-50%);
  }
}

.dot:nth-child(3) {
  animation-name: floatBottom;
}

@keyframes floatBottom {
  0%,
  100% {
    opacity: 0.3;
    transform: translateY(0px) translateX(-50%);
  }
  50% {
    opacity: 1;
    transform: translateY(10px) translateX(-50%);
  }
}

/* Indeterminate progress bar custom styling */
:deep(.v-progress-linear__determinate) {
  background: linear-gradient(
    90deg,
    rgba(139, 92, 42, 0.8) 0%,
    rgba(160, 110, 60, 0.8) 50%,
    rgba(139, 92, 42, 0.8) 100%
  );
}
</style>
