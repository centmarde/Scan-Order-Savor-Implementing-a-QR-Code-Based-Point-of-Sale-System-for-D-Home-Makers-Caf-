<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import html2canvas from "html2canvas";
import { APP_CONFIG } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";

const router = useRouter();
const route = useRoute();
const { primaryColor, secondaryColor } = useTheme();

// Get order data from route state or query
const order = ref<any>(null);
const tableId = ref<string | number>("");

onMounted(() => {
  // Get order from window.history.state (Vue Router 4)
  order.value = window.history.state?.order || null;
  // Handle tableId as string or array
  const tableParam = route.query.table;
  if (Array.isArray(tableParam)) {
    tableId.value = tableParam[0] || "";
  } else {
    tableId.value = tableParam || "";
  }
});

const downloadReceipt = async () => {
  const receiptEl = document.getElementById("receipt-content");
  if (!receiptEl) return;
  const canvas = await html2canvas(receiptEl);
  const link = document.createElement("a");
  link.download = "receipt.png";
  link.href = canvas.toDataURL();
  link.click();
};

const goToWaiting = () => {
  router.push({
    path: "/customer/waiting",
    query: { table: tableId.value },
  });
};
</script>

<template>
  <v-app>
    <v-main style="background-color: #f5f3ef">
      <v-container
        class="pa-4 d-flex flex-column align-center justify-center"
        style="min-height: 100vh"
      >
        <v-card
          id="receipt-content"
          class="pa-6 mb-6"
          elevation="8"
          rounded="xl"
          style="max-width: 420px; width: 100%"
        >
          <h2
            class="text-h5 font-weight-bold mb-2 text-center"
            :style="{ color: primaryColor }"
          >
            Order Receipt
          </h2>
          <div class="text-center mb-4">
            <v-chip color="primary" class="mr-2">
              <v-icon start>mdi-table-furniture</v-icon>
              Table {{ tableId }}
            </v-chip>
            <v-chip color="success">
              <v-icon start>mdi-check-circle</v-icon>
              Placed
            </v-chip>
          </div>
          <v-divider class="mb-4" />
          <div v-if="order && order.items && order.items.length">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="d-flex justify-space-between mb-2"
            >
              <span
                >{{ item.name }}
                <span v-if="item.quantity > 1">x{{ item.quantity }}</span></span
              >
              <span
                >{{ APP_CONFIG.CURRENCY
                }}{{ (item.price * item.quantity).toFixed(2) }}</span
              >
            </div>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between font-weight-bold text-h6">
              <span>Total</span>
              <span>{{ APP_CONFIG.CURRENCY }}{{ order.total.toFixed(2) }}</span>
            </div>
          </div>
          <div v-else class="text-center text-grey">No items found.</div>
        </v-card>
        <v-btn
          color="primary"
          class="mb-3"
          @click="downloadReceipt"
          size="large"
          rounded="xl"
        >
          <v-icon left>mdi-download</v-icon>
          Download Receipt
        </v-btn>
        <v-btn color="success" @click="goToWaiting" size="large" rounded="xl">
          <v-icon left>mdi-arrow-right</v-icon>
          Continue
        </v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
#receipt-content {
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border: 1px solid rgba(139, 92, 42, 0.1);
}
</style>
