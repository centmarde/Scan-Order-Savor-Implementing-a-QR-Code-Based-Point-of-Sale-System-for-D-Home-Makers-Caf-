<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
// We import the standard 'qrcode' package after installing it via npm
import QRCode from 'qrcode';
// NOTE: Make sure you have created and configured this store file
import { useQrCodeStore } from "@/stores/qrCodeStores"; 

// Define the correct type for the template reference map (canvas elements)
type QrCodeRefsMap = { [key: number]: HTMLCanvasElement | null };

// Get the store instance
const qrCodeStore = useQrCodeStore();

// Local state for the number of tables, used for the input field
const numTables = ref(qrCodeStore.shopConfig.totalTables);

// Template refs: A map to hold the HTML <canvas> elements where the QR codes will be drawn
const qrCodeRefs = ref<QrCodeRefsMap>({});

/**
 * Renders the QR code into the corresponding DOM element for each table.
 */
const generateQRCodes = async () => {
  // Wait for the template (v-for loop) to finish rendering the <canvas> elements
  await nextTick();

  qrCodeStore.tableIds.forEach(async (tableId) => {
    // Retrieve the specific ref element for the current table ID
    const targetEl = qrCodeRefs.value[tableId];
    
    if (targetEl) {
      // Clear previous content (not strictly necessary for canvas, but good practice)
      const context = targetEl.getContext('2d');
      if (context) {
        context.clearRect(0, 0, targetEl.width, targetEl.height);
      }
      
      // Get the full URL with the table query parameter
      const link = qrCodeStore.generateTableLink(tableId);

      try {
        // Use the imported QRCode package to draw the code directly to the canvas element
        await QRCode.toCanvas(targetEl, link, {
          width: 128,
          errorCorrectionLevel: 'H', // High error correction
          margin: 1, // Small margin for better appearance
        });
      } catch (e) {
        console.error(`Error generating QR code for Table ${tableId}:`, e);
      }
      
    } else {
        console.warn(`Could not find canvas element ref for Table ${tableId}`);
    }
  });
};

/**
 * Called when the user updates the table count in the input field.
 */
const updateTableCount = () => {
    // Only update if the number is valid and different
    if (numTables.value > 0 && numTables.value !== qrCodeStore.shopConfig.totalTables) {
        qrCodeStore.setTotalTables(numTables.value);
        generateQRCodes(); // Re-generate all QR codes after the table list updates
    }
};

// Initial generation when the component mounts
onMounted(() => {
  generateQRCodes();
});
</script>

<template>
    <v-app>
        <v-container class="pa-6 max-w-7xl mx-auto">
            <h1 class="text-h4 font-weight-bold mb-4" :style="{ color: 'var(--v-theme-primary)' }">
                Coffee Shop Table QR Code Generator
            </h1>
            <p class="text-subtitle-1 mb-6 text-grey-darken-2">
                Scanning the code directs the customer to: 
                <code class="font-weight-bold">{{ qrCodeStore.shopConfig.baseUrl }}</code>
            </p>

            <!-- Configuration Card -->
            <v-card class="mb-8 pa-4" rounded="xl" elevation="4">
                <v-card-title class="text-h6 font-weight-semibold">Configuration</v-card-title>
                <v-card-text>
                    <v-row align="center">
                        <v-col cols="12" md="6">
                            <v-text-field
                                v-model.number="numTables"
                                label="Total Number of Tables"
                                type="number"
                                min="1"
                                variant="outlined"
                                density="compact"
                                hide-details
                            ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6" class="d-flex justify-end">
                            <v-btn 
                                color="primary" 
                                variant="flat" 
                                @click="updateTableCount"
                                rounded="lg"
                                :disabled="numTables < 1 || numTables === qrCodeStore.shopConfig.totalTables"
                            >
                                Update & Generate Codes
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>

            <v-divider class="my-6"></v-divider>

            <h2 class="text-h5 font-weight-semibold mb-4">Generated QR Codes ({{ qrCodeStore.tableIds.length }})</h2>

            <!-- Grid for QR Codes -->
            <v-row>
                <v-col 
                    v-for="tableId in qrCodeStore.tableIds" 
                    :key="tableId" 
                    cols="12" 
                    sm="6" 
                    md="4" 
                    lg="3"
                >
                    <v-card class="d-flex flex-column align-center pa-4 text-center" rounded="xl" elevation="2">
                        <h3 class="text-h6 mb-3 font-weight-bold">TABLE #{{ tableId }}</h3>
                        
                        <!-- QR Code Container: Now a <canvas> element -->
                        <!-- The ref here connects the <canvas> to the qrCodeRefs map for generation -->
                        <div 
                            class="pa-2 border rounded-lg elevation-1"
                            style="line-height: 0; border: 2px solid #333;"
                        >
                             <canvas 
                                :ref="(el) => { if (el) qrCodeRefs[tableId] = el as HTMLCanvasElement }"
                                width="128"
                                height="128"
                            ></canvas>
                        </div>

                        <p class="mt-3 text-caption text-center text-grey-darken-1 wrap-text px-1">
                            {{ qrCodeStore.generateTableLink(tableId) }}
                        </p>
                    </v-card>
                </v-col>
            </v-row>
            
            <!-- Print Tip -->
            <!-- <v-alert
                v-if="qrCodeStore.tableIds.length > 0"
                type="info"
                variant="tonal"
                class="mt-8"
                rounded="lg"
            >
                <div class="d-flex align-center">
                    <v-icon class="mr-3">mdi-printer</v-icon>
                    Tip: Use your browser's print function (<kbd>Ctrl+P</kbd> or <kbd>Cmd+P</kbd>) to print these cards for your tables. The layout is optimized for clean printing.
                </div>
            </v-alert> -->

        </v-container>
    </v-app>
</template>

<style scoped>
/* Optimizations for printing the QR codes */
@media print {
    /* Set background to white for printing */
    .v-application, .v-main {
        background-color: white !important;
    }
    
    /* Hide elements that shouldn't be printed (config, tips, main title, etc.) */
    .v-container > :not(h2, .v-row) {
        display: none !important; 
    }
    
    /* Ensure cards stay together on a single page */
    .v-card {
        page-break-inside: avoid;
    }
    
    /* Force column width for a better print grid (e.g., 3 cards per row) */
    .v-col {
        width: 33.33% !important;
        max-width: 33.33% !important;
        flex: 0 0 33.33% !important;
    }
    
    /* Keep only the section header that says "Generated QR Codes" */
    h2 {
        display: block !important;
        margin-top: 1rem;
        margin-bottom: 1rem;
        text-align: center;
        font-size: 18pt; /* Larger for print */
    }
}
</style>
