<script setup lang="ts">
import { useTheme } from "@/composables/useTheme";
import {
  getStatusColor,
  getStatusIcon,
  getStatusLabel,
  getStatusValue,
  getLabelColor,
} from "@/utils/helpers";

// Props
interface Props {
  orderStatus: string;
}

const props = defineProps<Props>();

// Theme setup
const { primaryColor } = useTheme();
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
        :style="{ color: getLabelColor(orderStatus, primaryColor) }"
      >
        {{ getStatusLabel(orderStatus) }}
      </p>
      <p class="text-h6 font-weight-bold" :style="{ color: '#2D2D2D' }">
        {{ getStatusValue(orderStatus) }}
      </p>
    </div>
  </v-card>
</template>
