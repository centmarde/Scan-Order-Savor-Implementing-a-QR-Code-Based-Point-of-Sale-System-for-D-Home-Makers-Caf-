import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

// Define the base domain for the customer-facing menu application
const BASE_DOMAIN = 'https://dhome-makers.vercel.app';
const MENU_PATH = '/';

// LocalStorage key for persisting the table count
const STORAGE_KEY = 'coffee_shop_table_count';

/**
 * Pinia Store for managing QR code generation parameters and logic.
 * This is meant to be used on an internal Admin/Cashier page.
 */
export const useQrCodeStore = defineStore('qrCode', () => {
    // Load the persisted table count from localStorage, or default to 10
    const loadPersistedTableCount = (): number => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = parseInt(stored, 10);
                return parsed > 0 ? parsed : 10;
            }
        } catch (e) {
            console.error('Error loading persisted table count:', e);
        }
        return 10;
    };

    // State: Configuration for the coffee shop
    const shopConfig = ref({
        // The total number of tables in the coffee shop (load from localStorage)
        totalTables: loadPersistedTableCount(),
        // The base URL used for the QR code link (to the customer menu)
        baseUrl: `${BASE_DOMAIN}${MENU_PATH}`,
    });

    // Watch for changes to totalTables and persist to localStorage
    watch(
        () => shopConfig.value.totalTables,
        (newCount) => {
            try {
                localStorage.setItem(STORAGE_KEY, newCount.toString());
            } catch (e) {
                console.error('Error persisting table count:', e);
            }
        }
    );

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