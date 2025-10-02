<script setup lang="ts">
import { useTheme } from "@/composables/useTheme";

// Props
interface Props {
  orderStatus: string;
  itemCount: number;
}

const props = defineProps<Props>();

// Theme setup
const { primaryColor } = useTheme();

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
</script>

<template>
  <!-- Order Status Card -->
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
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center">
          <v-icon :style="{ color: primaryColor }" size="20" class="mr-2">
            mdi-receipt
          </v-icon>
          <h2 class="text-h6 font-weight-bold" :style="{ color: '#2D2D2D' }">
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
      <div class="d-flex align-center mb-2">
        <v-chip
          size="x-small"
          variant="flat"
          :style="{ backgroundColor: primaryColor, color: 'white' }"
          class="mr-2"
        >
          {{ itemCount }} item{{ itemCount > 1 ? "s" : "" }}
        </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>
