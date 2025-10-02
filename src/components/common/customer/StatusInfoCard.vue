<script setup lang="ts">
import { useTheme } from "@/composables/useTheme";

// Props
interface Props {
  orderStatus: string;
}

const props = defineProps<Props>();

// Theme setup
const { primaryColor } = useTheme();

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "#FFA726";
    case "confirmed":
      return "#42A5F5";
    case "preparing":
      return "#FF7043";
    case "ready":
      return "#4CAF50";
    case "completed":
      return "#4CAF50";
    case "cancelled":
      return "#F44336";
    default:
      return primaryColor.value;
  }
};

// Helper function to get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return "mdi-clock-outline";
    case "confirmed":
      return "mdi-check-circle-outline";
    case "preparing":
      return "mdi-chef-hat";
    case "ready":
      return "mdi-bell-ring";
    case "completed":
      return "mdi-check-all";
    case "cancelled":
      return "mdi-close-circle-outline";
    default:
      return "mdi-clock-outline";
  }
};

// Helper function to get status label
const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
    case "confirmed":
    case "preparing":
      return "Estimated Time";
    case "ready":
    case "completed":
    case "cancelled":
      return "Status";
    default:
      return "Estimated Time";
  }
};

// Helper function to get status value
const getStatusValue = (status: string) => {
  switch (status) {
    case "pending":
      return "3-5 minutes";
    case "confirmed":
      return "12-15 minutes";
    case "preparing":
      return "5-10 minutes";
    case "ready":
      return "Ready to Serve!";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "3-5 minutes";
  }
};

// Helper function to get label color
const getLabelColor = (status: string) => {
  switch (status) {
    case "ready":
    case "completed":
      return "#4CAF50";
    case "cancelled":
      return "#F44336";
    default:
      return primaryColor.value;
  }
};
</script>

<template>
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
      <v-icon
        :style="{ color: getStatusColor(orderStatus) }"
        size="24"
        class="mb-2"
      >
        {{ getStatusIcon(orderStatus) }}
      </v-icon>
      <p
        class="text-body-2 font-weight-medium mb-1"
        :style="{ color: getLabelColor(orderStatus) }"
      >
        {{ getStatusLabel(orderStatus) }}
      </p>
      <p class="text-h6 font-weight-bold" :style="{ color: '#2D2D2D' }">
        {{ getStatusValue(orderStatus) }}
      </p>
    </div>
  </v-card>
</template>
