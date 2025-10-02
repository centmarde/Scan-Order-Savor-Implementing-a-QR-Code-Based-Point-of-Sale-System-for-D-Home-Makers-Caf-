import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Pinia Store for managing the current customer's table information.
 * This ensures the table ID is accessible across the entire customer session
 * (e.g., in the Cart page, Checkout, etc.).
 */
export const useTableStore = defineStore('table', () => {
    // State: Stores the table ID captured from the URL
    const currentTableId = ref<number | null>(null);

    /**
     * Sets the current table ID for the customer session.
     * @param id The table number (e.g., 1, 2, 3).
     */
    const setTableId = (id: number) => {
        currentTableId.value = id;
        console.log(`Table ID set to: ${id}`);
    };

    /**
     * Clears the current table ID (e.g., after an order is complete).
     */
    const clearTableId = () => {
        currentTableId.value = null;
    };

    return {
        currentTableId,
        setTableId,
        clearTableId,
    };
});
