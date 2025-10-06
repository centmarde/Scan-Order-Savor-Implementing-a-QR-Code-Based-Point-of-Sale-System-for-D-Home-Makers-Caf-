<script setup lang="ts">
import { useTheme } from "@/composables/useTheme";

// Props
interface Props {
  orderStatus: string;
  tableId: number;
  showContent?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showContent: true,
});

// Theme setup
const { primaryColor } = useTheme();
</script>

<template>
  <!-- Dynamic Messages Based on Status -->
  <div
    class="mb-6 text-center"
    :class="{ 'animate-fade-in-delayed': showContent }"
  >
    <!-- Pending Status -->
    <div v-if="orderStatus === 'pending'">
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
        Your order has been successfully placed and is being reviewed by our
        kitchen team.
      </p>
      <p
        class="text-body-1 mb-4 px-4"
        :style="{ color: '#8B7355', lineHeight: '1.6' }"
      >
        Please sit back and relax while we confirm your order details.
      </p>
    </div>

    <!-- Confirmed Status -->
    <div v-else-if="orderStatus === 'confirmed'">
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
        Great news! Your order has been confirmed and our chefs are preparing to
        cook.
      </p>
      <p
        class="text-body-1 mb-4 px-4"
        :style="{ color: '#8B7355', lineHeight: '1.6' }"
      >
        Your delicious meal will be ready soon. Thank you for your patience!
      </p>
    </div>

    <!-- Preparing Status -->
    <div v-else-if="orderStatus === 'preparing'">
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
        Our talented chefs are carefully crafting your delicious meal with fresh
        ingredients.
      </p>
      <p
        class="text-body-1 mb-4 px-4"
        :style="{ color: '#8B7355', lineHeight: '1.6' }"
      >
        Your order will arrive momentarily. Thank you for your patience!
      </p>
    </div>

    <!-- Ready Status -->
    <div v-else-if="orderStatus === 'ready'">
      <h2 class="text-h5 font-weight-bold mb-3" :style="{ color: '#4CAF50' }">
        Your Order is Ready!
      </h2>
      <p class="text-h6 mb-4" :style="{ color: '#2E7D32' }">
        Please wait for our staff
      </p>
      <p
        class="text-body-1 mb-2 px-4"
        :style="{ color: '#388E3C', lineHeight: '1.6' }"
      >
        Excellent! Your order has been prepared and is ready to be served.
      </p>
      <p
        class="text-body-1 mb-4 px-4"
        :style="{ color: '#388E3C', lineHeight: '1.6' }"
      >
        Our staff will bring your meal to your table shortly. Enjoy your dining
        experience!
      </p>
    </div>

    <!-- Completed Status -->
    <div v-else-if="orderStatus === 'completed'">
      <h2 class="text-h5 font-weight-bold mb-3" :style="{ color: '#4CAF50' }">
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
        Thank you for choosing D'Home Makers Café. We look forward to serving
        you again.
      </p>
    </div>

    <!-- Cancelled Status -->
    <div v-else-if="orderStatus === 'cancelled'">
      <h2 class="text-h5 font-weight-bold mb-3" :style="{ color: '#F44336' }">
        Order Cancelled
      </h2>
      <p class="text-h6 mb-4" :style="{ color: '#C62828' }">
        We apologize for any inconvenience
      </p>
      <p
        class="text-body-1 mb-2 px-4"
        :style="{ color: '#D32F2F', lineHeight: '1.6' }"
      >
        Your order has been cancelled. If this was unexpected, please contact
        our staff.
      </p>
      <p
        class="text-body-1 mb-4 px-4"
        :style="{ color: '#D32F2F', lineHeight: '1.6' }"
      >
        We're here to help resolve any issues you may have experienced.
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
</template>

<style scoped>
/* Fade in animation */
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
</style>
