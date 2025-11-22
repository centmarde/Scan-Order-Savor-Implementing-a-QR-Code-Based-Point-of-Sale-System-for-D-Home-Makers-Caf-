<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText,
  getImageUrl,
} from "@/utils/helpers";
import type { OrderHistoryItem } from "@/stores/cashierData";

interface OrderItem {
  meal: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
  subtotal: number;
}

interface OrderSummary {
  items: OrderItem[];
  total: number;
  itemCount: number;
}

interface Props {
  modelValue: boolean;
  order: OrderHistoryItem | null;
  orderSummary: OrderSummary;
  canComplete: boolean;
  processing: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "complete"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const router = useRouter();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const handleComplete = () => {
  emit("complete");
};

const handlePrintReceipt = () => {
  if (!props.order) return;
  
  // Prepare receipt data matching the format Receipt.vue expects
  const receiptData = {
    id: props.order.id,
    items: props.orderSummary.items.map(item => ({
      id: item.meal.id,
      name: item.meal.name,
      price: item.meal.price,
      quantity: item.quantity
    })),
    total: props.orderSummary.total
  };
  
  // Store in sessionStorage for Receipt.vue to access
  sessionStorage.setItem("receiptData", JSON.stringify(receiptData));
  
  // Navigate to receipt page in a new tab/window
  const routeData = router.resolve({
    path: '/receipt',
    query: { table: props.order.table_id }
  });
  window.open(routeData.href, '_blank');
};
</script>

<template>
  <v-dialog v-model="dialogModel" max-width="700">
    <v-card v-if="order">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <span class="text-h5">Order #{{ order.id }}</span>
          <v-chip
            :color="getStatusColor(order.status)"
            size="small"
            class="ml-3"
          >
            {{ getStatusText(order.status) }}
          </v-chip>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="dialogModel = false"
        ></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-6">
        <!-- Order Information -->
        <v-row class="mb-4">
          <v-col cols="6">
            <div class="text-caption text-grey mb-1">Table Number</div>
            <div class="text-h6 font-weight-bold">
              Table {{ order.table_id }}
            </div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-grey mb-1">Order Time</div>
            <div class="font-weight-medium">
              {{ formatDate(order.created_at) }}
            </div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-grey mb-1">Total Items</div>
            <div class="font-weight-medium">
              {{ orderSummary.itemCount }} items
            </div>
          </v-col>
          <v-col cols="6">
            <div class="text-caption text-grey mb-1">Total Amount</div>
            <div class="text-h6 font-weight-bold text-primary">
              {{ formatCurrency(order.total_amount) }}
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <!-- Order Items -->
        <div>
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Order Items</h3>

          <v-list lines="two">
            <v-list-item
              v-for="item in orderSummary.items"
              :key="item.meal.id"
              class="px-0"
            >
              <template v-slot:prepend>
                <v-avatar size="56" rounded class="mr-3">
                  <v-img :src="getImageUrl(item.meal.image)"></v-img>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ item.meal.name }}
              </v-list-item-title>

              <v-list-item-subtitle>
                {{ formatCurrency(item.meal.price) }} × {{ item.quantity }}
              </v-list-item-subtitle>

              <template v-slot:append>
                <div class="text-h6 font-weight-bold">
                  {{ formatCurrency(item.subtotal) }}
                </div>
              </template>
            </v-list-item>
          </v-list>
        </div>

        <v-divider class="my-4"></v-divider>

        <!-- Total -->
        <div
          class="d-flex justify-space-between align-center pa-4 bg-grey-lighten-4 rounded"
        >
          <span class="text-h6 font-weight-bold">Total Amount</span>
          <span class="text-h5 font-weight-bold text-primary">
            {{ formatCurrency(orderSummary.total) }}
          </span>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <!-- Print Receipt Button -->
        <v-btn
          color="info"
          variant="flat"
          prepend-icon="mdi-printer"
          @click="handlePrintReceipt"
        >
          Print Receipt
        </v-btn>
        
        <!-- Complete Button (only show for ready/preparing orders) -->
        <v-btn
          v-if="canComplete"
          color="success"
          variant="flat"
          prepend-icon="mdi-check-circle"
          @click="handleComplete"
          :loading="processing"
        >
          Mark as Completed
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="flat" @click="dialogModel = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>