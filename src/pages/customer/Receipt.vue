<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { APP_CONFIG } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";

const router = useRouter();
const route = useRoute();
const { primaryColor, secondaryColor } = useTheme();

// Get order data from route state or query
const order = ref<any>(null);
const tableId = ref<string | number>("");
const isExporting = ref(false);

onMounted(() => {
  // Try to get order from sessionStorage first (more reliable)
  const storedReceipt = sessionStorage.getItem("receiptData");
  if (storedReceipt) {
    try {
      order.value = JSON.parse(storedReceipt);
      // Clear after loading to prevent stale data
      sessionStorage.removeItem("receiptData");
    } catch (e) {
      // Ignore parse errors
    }
  } else {
    // Fallback to window.history.state
    order.value = window.history.state?.order || null;
  }

  // Handle tableId as string or array
  const tableParam = route.query.table;
  if (Array.isArray(tableParam)) {
    tableId.value = tableParam[0] || "";
  } else {
    tableId.value = tableParam || "";
  }
});

const exportToPDF = async () => {
  try {
    isExporting.value = true;
    const element = document.getElementById("receipt-content");
    const badge = document.querySelector(".success-badge") as HTMLElement;
    if (!element) return;

    // Temporarily hide the success badge for clean PDF
    if (badge) badge.style.display = "none";

    // Capture the receipt as canvas with high quality
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Restore the badge
    if (badge) badge.style.display = "";

    // Use thermal receipt size (80mm width) for better proportions
    const receiptWidthMM = 80;
    const aspectRatio = canvas.height / canvas.width;
    const receiptHeightMM = receiptWidthMM * aspectRatio;

    // Create PDF with custom size
    const pdf = new jsPDF({
      orientation: receiptHeightMM > receiptWidthMM ? "portrait" : "portrait",
      unit: "mm",
      format: [receiptWidthMM, receiptHeightMM],
      compress: true,
    });

    // Add image to PDF (full bleed, no margins)
    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(
      imgData,
      "PNG",
      0,
      0,
      receiptWidthMM,
      receiptHeightMM,
      undefined,
      "FAST"
    );

    // Generate filename with order details
    const orderRef = order.value?.id || "receipt";
    const filename = `receipt-${orderRef}-table-${tableId.value}.pdf`;

    // Download the PDF
    pdf.save(filename);
  } catch (error) {
    alert("Failed to export PDF. Please try again.");
  } finally {
    isExporting.value = false;
  }
};

const goToWaiting = () => {
  router.push({
    path: "/customer/waiting",
    query: { table: tableId.value },
  });
};

// Format current date and time
const getCurrentDateTime = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  return now.toLocaleString("en-US", options);
};

// Function to lighten color for background
const lightenColor = (color: string, percent: number) => {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
};
</script>

<template>
  <v-app>
    <v-main
      :style="{
        background: `linear-gradient(180deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
      }"
    >
      <v-container
        class="pa-4 d-flex flex-column align-center justify-center"
        style="min-height: 100vh"
      >
        <!-- Receipt Card -->
        <v-card
          id="receipt-content"
          class="pa-0 mb-6 receipt-card"
          elevation="0"
          rounded="xl"
          style="
            max-width: 420px;
            width: 100%;
            position: relative;
            overflow: visible;
          "
        >
          <!-- Success Checkmark Circle -->
          <div
            class="success-badge"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            }"
          >
            <v-icon color="white" size="32">mdi-check</v-icon>
          </div>

          <div class="pa-6 pt-12">
            <!-- Title -->
            <h2
              class="text-h5 font-weight-bold mb-6 text-center"
              :style="{ color: primaryColor, letterSpacing: '0.15em' }"
            >
              ORDER RECEIPT
            </h2>

            <!-- Table Info -->
            <div
              class="text-center mb-6 pa-3 rounded-lg"
              :style="{ backgroundColor: lightenColor(primaryColor, 45) }"
            >
              <div
                class="text-h6 font-weight-bold"
                :style="{ color: primaryColor }"
              >
                Table {{ tableId }}
              </div>
              <div class="text-caption text-grey-darken-1">
                Order Placed Successfully
              </div>
            </div>

            <v-divider class="mb-4" style="border-color: #e0e0e0" />

            <!-- Items List -->
            <div v-if="order && order.items && order.items.length">
              <div class="mb-4">
                <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="d-flex justify-space-between align-center mb-3"
                >
                  <div>
                    <div class="font-weight-medium">{{ item.name }}</div>
                    <div
                      v-if="item.quantity > 1"
                      class="text-caption text-grey"
                    >
                      Qty: {{ item.quantity }}
                    </div>
                  </div>
                  <span class="font-weight-medium">
                    {{ APP_CONFIG.CURRENCY
                    }}{{ (item.price * item.quantity).toFixed(2) }}
                  </span>
                </div>
              </div>

              <v-divider class="my-4" style="border-color: #e0e0e0" />

              <!-- Total Amount -->
              <div class="mb-4">
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-body-1">Amount</span>
                  <span class="text-body-1">{{ order.total.toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-space-between align-center">
                  <span class="text-h6 font-weight-bold">Total Amount</span>
                  <span
                    class="text-h5 font-weight-bold"
                    :style="{ color: primaryColor }"
                  >
                    {{ APP_CONFIG.CURRENCY }}{{ order.total.toFixed(2) }}
                  </span>
                </div>
              </div>

              <v-divider class="my-4" style="border-color: #e0e0e0" />

              <!-- Reference Number and Date -->
              <div class="text-center mb-4">
                <div class="text-caption text-grey-darken-1 mb-1">
                  Ref No.
                  {{ order.id || Math.floor(Math.random() * 100000000) }}
                </div>
                <div class="text-caption text-grey">
                  {{ getCurrentDateTime() }}
                </div>
              </div>

              <!-- Environmental Message -->
              <div
                class="pa-3 rounded-lg"
                style="
                  background: linear-gradient(135deg, #7ef5b7 0%, #5fe9a5 100%);
                "
              >
                <div class="d-flex align-center mb-2">
                  <v-icon color="success-darken-2" class="mr-2"
                    >mdi-leaf</v-icon
                  >
                  <span
                    class="text-body-2 font-weight-bold"
                    style="color: #1b5e20"
                  >
                    Thank you for going digital!
                  </span>
                </div>
                <div class="text-caption" style="color: #2e7d32">
                  By choosing digital ordering, you reduce paper waste and help
                  protect the environment.
                </div>
              </div>
            </div>
            <div v-else class="text-center text-grey py-6">No items found.</div>
          </div>

          <!-- Zigzag Bottom Edge -->
          <div class="zigzag-bottom"></div>
        </v-card>

        <!-- Action Buttons -->
        <div
          class="d-flex flex-column ga-3"
          style="width: 100%; max-width: 420px"
        >
          <!-- Export PDF Button -->
          <v-btn
            color="white"
            @click="exportToPDF"
            size="large"
            rounded="xl"
            elevation="2"
            :loading="isExporting"
            :disabled="!order || !order.items || order.items.length === 0"
            :style="{ color: primaryColor }"
          >
            <v-icon left>mdi-download</v-icon>
            Export as PDF
          </v-btn>

          <!-- Continue Button -->
          <v-btn
            :color="primaryColor"
            @click="goToWaiting"
            size="large"
            rounded="xl"
            elevation="2"
            style="color: white"
          >
            <v-icon left>mdi-arrow-right</v-icon>
            Continue
          </v-btn>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.receipt-card {
  background: #ffffff;
  position: relative;
}

.success-badge {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.zigzag-bottom {
  height: 20px;
  background: linear-gradient(
      135deg,
      transparent 33.33%,
      #ffffff 33.33%,
      #ffffff 66.67%,
      transparent 66.67%
    ),
    linear-gradient(
      45deg,
      transparent 33.33%,
      #ffffff 33.33%,
      #ffffff 66.67%,
      transparent 66.67%
    );
  background-size: 20px 40px;
  background-position: 0 0, 0 0;
  background-repeat: repeat-x;
  position: relative;
  width: 100%;
}

/* Alternative simpler zigzag pattern */
.zigzag-bottom::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(-45deg, transparent 16px, #ffffff 0),
    linear-gradient(45deg, transparent 16px, #ffffff 0);
  background-repeat: repeat-x;
  background-size: 32px 32px;
  background-position: left bottom;
}
</style>
