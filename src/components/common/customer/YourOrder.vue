<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { APP_CONFIG } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";
import { useReviewOrder } from "@/composables/useReviewOrder";
import { useTableContext } from "@/pages/admin/composables/useTableContext";
import { useMenuDataStore } from "@/stores/menuData";
import { useToast } from "vue-toastification";
import StatusCard from "./StatusCard.vue";
import type { MenuItem } from "@/stores/menuData";

// Props
interface Props {
  showStatusCard?: boolean; // Whether to show the status card
  orderStatus?: string; // Order status for the status card
}

const props = withDefaults(defineProps<Props>(), {
  showStatusCard: false,
  orderStatus: "pending",
});

// Router and composables
const router = useRouter();
const menuDataStore = useMenuDataStore();
const toast = useToast();

// Theme setup
const { initializeTheme, primaryColor, secondaryColor } = useTheme();

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
  itemCount: composableItemCount,
  groupedCartItems: composableGroupedCartItems,
  cartTotal: composableCartTotal,
  initializeTableId,
  loadCartData,
  fetchOrdersForTable,
  createOrder,
} = useReviewOrder();

// Local reactive data
const orderStatus = ref(props.orderStatus);

// Emits (keeping only statusCardClick for StatusCard functionality)
const emit = defineEmits<{
  statusCardClick: [tableId: number | string | undefined]; // When status card is clicked
}>();

// Computed properties - use the composable data
const groupedCartItems = computed(() => composableGroupedCartItems.value);
const cartTotal = computed(() => composableCartTotal.value);
const itemCount = computed(() => composableItemCount.value);

// Check if item has reached max quantity
const isMaxQuantityReached = (itemId: number): boolean => {
  const menuItem = menuDataStore.getItemById(itemId);
  if (!menuItem) return true;

  const currentQuantityInCart = cartItems.value.filter(item => item.id === itemId).length;
  return currentQuantityInCart >= menuItem.quantity;
};

// Cart update listener function
const handleCartUpdate = () => {
  loadCartData();
};

// Periodic check interval
let cartCheckInterval: ReturnType<typeof setInterval>;

// Initialize component on mount
onMounted(async () => {
  await initializeTheme();

  // Initialize table ID and load cart data
  initializeTableId();
  loadCartData();

  // Fetch existing orders for this table
  await fetchOrdersForTable();

  // Listen for cart updates from Menu.vue
  window.addEventListener('cartUpdated', handleCartUpdate);

  // Set up periodic check as fallback (every 1 second)
  cartCheckInterval = setInterval(() => {
    loadCartData();
  }, 1000);
});

// Cleanup listener on unmount
onUnmounted(() => {
  window.removeEventListener('cartUpdated', handleCartUpdate);
  if (cartCheckInterval) {
    clearInterval(cartCheckInterval);
  }
});

// Watch for changes in order status prop
watch(() => props.orderStatus, (newStatus) => {
  orderStatus.value = newStatus;
});

// Methods
const cancelOrder = () => {
  // Clear cart items and navigate back to menu
  cartItems.value = [];
  // Save empty cart to persistence
  sessionStorage.removeItem('cartItems');
  localStorage.removeItem('cartItems');
  router.push('/customer/menu');
};

const reviewOrder = () => {
  // Navigate to review order page
  const actualTableId = getCurrentTableId();
  router.push({
    path: "/customer/review-order",
    query: { table: actualTableId.toString() },
  });
};

const removeItem = (itemId: number) => {
  // Find and remove one instance of the item
  const itemIndex = cartItems.value.findIndex(item => item.id === itemId);
  if (itemIndex !== -1) {
    cartItems.value.splice(itemIndex, 1);
    // Persist changes
    sessionStorage.setItem('cartItems', JSON.stringify(cartItems.value));
    localStorage.setItem('cartItems', JSON.stringify(cartItems.value));
  }
};

const addItem = (itemId: number) => {
  // Get the menu item to check available quantity
  const menuItem = menuDataStore.getItemById(itemId);
  if (!menuItem) {
    toast.error('Item not found');
    return;
  }

  // Count current quantity in cart
  const currentQuantityInCart = cartItems.value.filter(item => item.id === itemId).length;

  // Check if adding one more would exceed available quantity
  if (currentQuantityInCart >= menuItem.quantity) {
    toast.warning(`Maximum quantity reached! Only ${menuItem.quantity} available in stock.`);
    return;
  }

  // Find the item from existing cart items to add another instance
  const existingItem = cartItems.value.find(item => item.id === itemId);
  if (existingItem) {
    cartItems.value.push({ ...existingItem });
    // Persist changes
    sessionStorage.setItem('cartItems', JSON.stringify(cartItems.value));
    localStorage.setItem('cartItems', JSON.stringify(cartItems.value));
  }
};

const handleStatusCardClick = (tableId: number | string | undefined) => {
  emit("statusCardClick", tableId);
};
</script>

<template>
  <div
    v-if="cartItems.length > 0"
    class="position-sticky pb-4"
    style="bottom: 0; z-index: 10; background: #f5f3ef"
  >
    <!-- Optional Status Card -->
    <div v-if="showStatusCard" class="mx-4 mb-4">
      <StatusCard
        :order-status="orderStatus"
        :cart-items="cartItems"
        :table-id="contextTableId"
        @click="handleStatusCardClick"
      />
    </div>
    <!-- Your Order Header -->
    <v-card
      class="mx-4 mb-4"
      elevation="8"
      rounded="xl"
      :style="{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: '1px solid rgba(139, 92, 42, 0.1)',
      }"
    >
      <v-card-text class="pa-5">
        <!-- Header with Your Order -->
        <div class="d-flex align-center mb-4">
          <v-icon :style="{ color: primaryColor }" size="24" class="mr-2">
            mdi-cart
          </v-icon>
          <h3 class="text-h6 font-weight-bold" :style="{ color: '#2D2D2D' }">
            Your Order
          </h3>
          <v-spacer />
          <v-chip
            size="small"
            variant="flat"
            :style="{ backgroundColor: primaryColor, color: 'white' }"
            class="ml-2"
          >
            {{ itemCount }} item{{ itemCount > 1 ? "s" : "" }}
          </v-chip>
        </div>

        <!-- Order Items List -->
        <v-card
          variant="flat"
          class="mb-4"
          rounded="lg"
          style="background-color: #f8f9fa"
        >
          <v-list
            class="pa-3"
            max-height="180"
            style="overflow-y: auto; background: transparent"
          >
            <v-list-item
              v-for="groupedItem in groupedCartItems"
              :key="groupedItem.item.id"
              class="px-4 py-3 mb-2 rounded-lg elevation-1"
              :style="{
                backgroundColor: '#ffffff',
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }"
            >
              <template v-slot:prepend>
                <div class="position-relative mr-3">
                  <v-avatar
                    size="40"
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
                    size="x-small"
                    class="position-absolute"
                    :style="{
                      top: '-5px',
                      right: '-5px',
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

              <v-list-item-content>
                <v-list-item-title
                  class="text-body-2 font-weight-bold mb-1"
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
                  class="text-caption font-weight-medium"
                  :style="{ color: primaryColor }"
                >
                  {{ APP_CONFIG.CURRENCY
                  }}{{ groupedItem.item.price.toFixed(2) }} each
                  <span v-if="groupedItem.quantity > 1" class="ml-1">
                    • Total: {{ APP_CONFIG.CURRENCY
                    }}{{
                      (groupedItem.item.price * groupedItem.quantity).toFixed(2)
                    }}
                  </span>
                </v-list-item-subtitle>
              </v-list-item-content>

              <template v-slot:append>
                <div class="d-flex align-center">
                  <v-btn
                    @click="removeItem(groupedItem.item.id)"
                    icon
                    size="small"
                    variant="text"
                    class="ml-1"
                    :style="{ color: '#dc3545' }"
                  >
                    <v-icon size="18">mdi-minus-circle</v-icon>
                  </v-btn>
                  <v-btn
                    @click="addItem(groupedItem.item.id)"
                    icon
                    size="small"
                    variant="text"
                    :disabled="isMaxQuantityReached(groupedItem.item.id)"
                    :style="{ color: isMaxQuantityReached(groupedItem.item.id) ? '#9e9e9e' : primaryColor }"
                  >
                    <v-icon size="18">mdi-plus-circle</v-icon>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Bottom Action Buttons -->
        <v-divider class="my-3"></v-divider>

        <v-row class="align-center" dense no-gutters>
          <!-- Cancel Button -->
          <v-col cols="3">
            <v-btn
              @click="cancelOrder"
              variant="outlined"
              size="default"
              rounded="pill"
              color="error"
              block
              class="text-caption font-weight-bold"
            >
              CANCEL
            </v-btn>
          </v-col>

          <!-- Review + Pay Button -->
          <v-col cols="6" class="px-3">
            <v-btn
              @click="reviewOrder"
              variant="flat"
              size="default"
              rounded="pill"
              :style="{ backgroundColor: primaryColor, color: 'white' }"
              block
              class="text-caption font-weight-bold"
              elevation="2"
            >
              <span class="d-sm-inline">REVIEW + PAY</span>
            </v-btn>
          </v-col>

          <!-- Total Amount -->
          <v-col cols="3">
            <v-card
              variant="outlined"
              rounded="pill"
              :style="{ borderColor: primaryColor, borderWidth: '2px' }"
              class="pa-2 text-center"
            >
              <span
                class="text-caption font-weight-bold"
                :style="{ color: primaryColor }"
              >
                {{ APP_CONFIG.CURRENCY }}{{ cartTotal.toFixed(2) }}
              </span>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>
