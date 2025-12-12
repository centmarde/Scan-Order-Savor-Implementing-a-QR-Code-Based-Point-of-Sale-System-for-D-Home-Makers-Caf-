<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "@/composables/useTheme";
import { getStatusColor, getStatusText } from "@/utils/helpers";
import { useRouter } from "vue-router";
import { APP_CONFIG } from "@/utils/constants";
import type { MenuItem } from "@/stores/menuData";

// Props
interface Props {
  orderStatus: string;
  cartItems: MenuItem[]; // Use cart items from YourOrder instead of itemCount
  tableId?: number | string; // Optional table ID for navigation
  clickable?: boolean; // Whether the card should be clickable
}

const props = withDefaults(defineProps<Props>(), {
  clickable: true,
});

// Computed properties - derive data from cart items like YourOrder does
const itemCount = computed(() => props.cartItems.length);

const cartTotal = computed(() => {
  return props.cartItems.reduce(
    (total: number, item: MenuItem) => total + item.price,
    0
  );
});

// Determine if the card should be clickable - not clickable when status is "ready"
const isClickable = computed(() => {
  return props.clickable && props.orderStatus !== "ready";
});

// Emits
const emit = defineEmits<{
  click: [tableId: number | string | undefined];
}>();

// Composables
const { primaryColor } = useTheme();
const router = useRouter();

// Methods
const handleCardClick = () => {
  if (!isClickable.value) return;

  // Emit click event for parent components to handle if needed
  emit("click", props.tableId);

  // Navigate directly to receipt page if table ID is provided
  if (props.tableId && props.cartItems.length > 0) {
    // Prepare receipt data from cart items
    const receiptData = {
      items: props.cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1, // Assuming quantity of 1 for each cart item
      })),
      total: cartTotal.value,
      id: Math.floor(Math.random() * 100000000), // Generate a random order ID
    };

    // Store receipt data in sessionStorage for reliable transfer
    sessionStorage.setItem("receiptData", JSON.stringify(receiptData));

    // Navigate to receipt page
    router.push({
      path: "/customer/receipt",
      query: { table: props.tableId.toString() },
    });
  }
};
</script>

<template>
  <!-- Order Status Card -->
  <v-card
    class="mb-3"
    elevation="2"
    rounded="lg"
    :class="{ 'cursor-pointer': isClickable }"
    :style="{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      border: '1px solid rgba(139, 92, 42, 0.1)',
      transition: 'all 0.3s ease',
      cursor: isClickable ? 'pointer' : 'default',
    }"
    :hover="isClickable"
    @click="handleCardClick"
    @keyup.enter="handleCardClick"
    :tabindex="isClickable ? 0 : -1"
    role="button"
    :aria-label="isClickable && tableId ? `View receipt for table ${tableId}` : undefined"
  >
    <v-card-text class="pa-3">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center">
          <v-icon :style="{ color: primaryColor }" size="20" class="mr-2">
            mdi-receipt
          </v-icon>
          <h2 class="text-h6 font-weight-bold" :style="{ color: '#2D2D2D' }">
            View Receipt
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
      <div class="d-flex align-center mb-2">
        <div class="d-flex align-center gap-2">
          <v-chip
            size="x-small"
            variant="flat"
            :style="{ backgroundColor: primaryColor, color: 'white' }"
          >
            {{ itemCount }} item{{ itemCount > 1 ? "s" : "" }}
          </v-chip>
          <v-chip
            v-if="cartTotal > 0"
            size="x-small"
            variant="outlined"
            :style="{ borderColor: primaryColor, color: primaryColor }"
          >
            {{ APP_CONFIG.CURRENCY }}{{ cartTotal.toFixed(2) }}
          </v-chip>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 42, 0.15) !important;
}

.cursor-pointer {
  cursor: pointer;
}

.v-card:focus {
  outline: 2px solid rgba(139, 92, 42, 0.5);
  outline-offset: 2px;
}
</style>
