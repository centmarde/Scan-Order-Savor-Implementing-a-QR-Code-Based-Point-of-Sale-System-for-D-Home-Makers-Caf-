import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Define the base domain for the customer-facing menu application
const BASE_DOMAIN = 'https://dhome-makers.vercel.app';
const MENU_PATH = '/menu';

/**
 * Pinia Store for managing QR code generation parameters and logic.
 * This is meant to be used on an internal Admin/Cashier page.
 */
export const useQrCodeStore = defineStore('qrCode', () => {
    // State: Configuration for the coffee shop (defaulting to 10 tables)
    const shopConfig = ref({
        // The total number of tables in the coffee shop
        totalTables: 10,
        // The base URL used for the QR code link (to the customer menu)
        baseUrl: `${BASE_DOMAIN}${MENU_PATH}`,
    });

    // Computed: Generate a list of all table IDs (1, 2, 3, ...)
    const tableIds = computed(() => {
        // Creates an array [1, 2, ..., totalTables]
        return Array.from({ length: shopConfig.value.totalTables }, (_, i) => i + 1);
    });

    /**
     * Constructs the full, scannable URL for a specific table.
     * Example: https://dhome-makers.vercel.app/menu?table=5
     * @param tableId The ID of the table.
     * @returns The full URL string with the table query parameter.
     */
    const generateTableLink = (tableId: number): string => {
        return `${shopConfig.value.baseUrl}?table=${tableId}`;
    };

    /**
     * Updates the total number of tables.
     * @param count The new total number of tables.
     */
    const setTotalTables = (count: number) => {
        if (count >= 1) {
            shopConfig.value.totalTables = count;
        } else {
            // Log an error if the count is invalid
            console.error("Total tables must be at least 1.");
        }
    };

    return {
        shopConfig,
        tableIds,
        generateTableLink,
        setTotalTables,
    };
});
