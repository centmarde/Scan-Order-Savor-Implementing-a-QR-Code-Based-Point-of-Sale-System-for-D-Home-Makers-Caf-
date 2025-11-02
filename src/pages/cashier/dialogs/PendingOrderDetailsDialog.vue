<script setup lang="ts">
import { computed } from "vue";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText,
  getImageUrl,
} from "@/utils/helpers";
import type { OrderWithMeals } from "@/stores/orderData";

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
  order: OrderWithMeals | null;
  orderSummary: OrderSummary;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "approve", order: OrderWithMeals): void;
  (e: "reject", order: OrderWithMeals): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const handleApprove = () => {
  if (props.order) {
    emit("approve", props.order);
  }
};

const handleReject = () => {
  if (props.order) {
    emit("reject", props.order);
  }
};
</script>

<template>
  <v-dialog v-model="dialogModel" max-width="600">
    <v-card v-if="order">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Order #{{ order.id }} Details</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="dialogModel = false"
        ></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-4">
        <!-- Order Info -->
        <div class="mb-4">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-grey">Table Number:</span>
            <span class="font-weight-bold">{{ order.table_id }}</span>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span class="text-grey">Order Time:</span>
            <span>{{ formatDate(order.created_at) }}</span>
          </div>
          <div class="d-flex justify-space-between">
            <span class="text-grey">Status:</span>
            <v-chip :color="getStatusColor(order.status)" size="small">
              {{ getStatusText(order.status) }}
            </v-chip>
          </div>
        </div>

        <v-divider class="my-4"></v-divider>

        <!-- Order Items -->
        <div class="mb-4">
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Order Items</h3>
          <div
            v-for="item in orderSummary.items"
            :key="item.meal.id"
            class="d-flex justify-space-between align-center mb-3"
          >
            <div class="d-flex align-center">
              <v-avatar size="48" class="mr-3" rounded>
                <v-img :src="getImageUrl(item.meal.image)"></v-img>
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ item.meal.name }}</div>
                <div class="text-caption text-grey">
                  {{ formatCurrency(item.meal.price) }} × {{ item.quantity }}
                </div>
              </div>
            </div>
            <div class="font-weight-bold">
              {{ formatCurrency(item.subtotal) }}
            </div>
          </div>
        </div>

        <v-divider class="my-4"></v-divider>

        <!-- Total -->
        <div class="d-flex justify-space-between align-center">
          <span class="text-h6 font-weight-bold">Total</span>
          <span class="text-h6 font-weight-bold text-primary">
            {{ formatCurrency(orderSummary.total) }}
          </span>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="error"
          variant="outlined"
          @click="handleReject"
        >
          Reject Order
        </v-btn>
        <v-btn
          color="success"
          variant="flat"
          @click="handleApprove"
        >
          Approve & Send to Kitchen
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>