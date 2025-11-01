/**
 * Table Context Composable
 * 
 * Manages the table context throughout the customer ordering flow.
 * Captures table ID from URL query parameter and persists it in sessionStorage.
 * 
 * Usage:
 * import { useTableContext } from '@/composables/useTableContext';
 * 
 * const { tableId, hasTable, initializeTable } = useTableContext();
 */

import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const STORAGE_KEY = 'customer_table_id';
const DEFAULT_TABLE = 1;

// Shared state across all instances
const currentTableId = ref<number>(DEFAULT_TABLE);
const isInitialized = ref<boolean>(false);

export const useTableContext = () => {
  const route = useRoute();

  /**
   * Check if we have a valid table context
   */
  const hasTable = computed(() => {
    return currentTableId.value > 0;
  });

  /**
   * Get table ID (reactive)
   */
  const tableId = computed(() => currentTableId.value);

  /**
   * Load table ID from sessionStorage
   */
  const loadFromStorage = (): number | null => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          console.log('📍 Loaded table from storage:', parsed);
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading table from storage:', error);
    }
    return null;
  };

  /**
   * Save table ID to sessionStorage
   */
  const saveToStorage = (tableId: number): void => {
    try {
      sessionStorage.setItem(STORAGE_KEY, tableId.toString());
      console.log('💾 Saved table to storage:', tableId);
    } catch (error) {
      console.error('Error saving table to storage:', error);
    }
  };

  /**
   * Parse table ID from URL query parameter
   */
  const parseFromUrl = (): number | null => {
    const tableParam = route.query.table;
    
    if (tableParam) {
      const parsed = parseInt(tableParam as string, 10);
      
      if (!isNaN(parsed) && parsed > 0) {
        console.log('🔗 Parsed table from URL:', parsed);
        return parsed;
      } else {
        console.warn('⚠️ Invalid table parameter in URL:', tableParam);
      }
    }
    
    return null;
  };

  /**
   * Initialize table context
   * Priority: URL parameter > sessionStorage > default
   */
  const initializeTable = (): void => {
    if (isInitialized.value) {
      console.log('✅ Table already initialized:', currentTableId.value);
      return;
    }

    // Try to get from URL first
    let tableFromUrl = parseFromUrl();
    
    if (tableFromUrl) {
      currentTableId.value = tableFromUrl;
      saveToStorage(tableFromUrl);
      isInitialized.value = true;
      console.log('✅ Table initialized from URL:', currentTableId.value);
      return;
    }

    // Try to get from storage
    let tableFromStorage = loadFromStorage();
    
    if (tableFromStorage) {
      currentTableId.value = tableFromStorage;
      isInitialized.value = true;
      console.log('✅ Table initialized from storage:', currentTableId.value);
      return;
    }

    // Use default
    currentTableId.value = DEFAULT_TABLE;
    saveToStorage(DEFAULT_TABLE);
    isInitialized.value = true;
    console.warn('⚠️ No table parameter found, using default:', DEFAULT_TABLE);
  };

  /**
   * Set table ID manually
   */
  const setTableId = (newTableId: number): void => {
    if (newTableId > 0) {
      currentTableId.value = newTableId;
      saveToStorage(newTableId);
      console.log('📝 Table ID set manually:', newTableId);
    } else {
      console.error('❌ Invalid table ID:', newTableId);
    }
  };

  /**
   * Clear table context (after order completion)
   */
  const clearTable = (): void => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      currentTableId.value = DEFAULT_TABLE;
      isInitialized.value = false;
      console.log('🗑️ Table context cleared');
    } catch (error) {
      console.error('Error clearing table context:', error);
    }
  };

  /**
   * Get current table ID (non-reactive)
   */
  const getCurrentTableId = (): number => {
    return currentTableId.value;
  };

  // Auto-initialize on mount (optional - can be called manually)
  onMounted(() => {
    if (!isInitialized.value) {
      initializeTable();
    }
  });

  return {
    // Computed
    tableId,
    hasTable,
    
    // Methods
    initializeTable,
    setTableId,
    clearTable,
    getCurrentTableId,
  };
};

/**
 * Global function to get current table ID from anywhere
 * Useful for stores or utilities that can't use composables
 */
export const getGlobalTableId = (): number => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error getting global table ID:', error);
  }
  return DEFAULT_TABLE;
};