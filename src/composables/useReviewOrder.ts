/**
 * Review Order Composable
 *
 * Handles cart data loading, order fetching, and order processing logic
 * for the ReviewOrder page to reduce component complexity
 */

import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useTableStore } from "@/stores/tableStores";
import { useOrderDataStore, type OrderWithMeals } from "@/stores/orderData";
import type { MenuItem } from "@/stores/menuData";

export function useReviewOrder() {
  const route = useRoute();
  const tableStore = useTableStore();
  const orderDataStore = useOrderDataStore();

  // Reactive data
  const loading = ref(false);
  const loadingOrders = ref(false);
  const cartItems = ref<MenuItem[]>([]);
  const ordersWithMeals = ref<OrderWithMeals[]>([]);

  // Computed properties
  const tableId = computed(() => {
    return tableStore.currentTableId || 1; // Default to table 1 if no table ID is set
  });

  const groupedCartItems = computed(() => {
    const grouped: { [key: number]: { item: MenuItem; quantity: number } } = {};

    cartItems.value.forEach((item) => {
      if (grouped[item.id]) {
        grouped[item.id].quantity += 1;
      } else {
        grouped[item.id] = { item, quantity: 1 };
      }
    });

    return Object.values(grouped);
  });

  const groupedOrderItems = computed(() => {
    const grouped: { [key: number]: { item: MenuItem; quantity: number } } = {};

    ordersWithMeals.value.forEach((order) => {
      if (order.meal) {
        if (grouped[order.meal.id]) {
          grouped[order.meal.id].quantity += 1;
        } else {
          grouped[order.meal.id] = { item: order.meal, quantity: 1 };
        }
      }
    });

    return Object.values(grouped);
  });

  const displayItems = computed(() => {
    // Show cart items if available (new order), otherwise show database orders
    const hasCartItems = cartItems.value.length > 0;
    const hasOrderItems = groupedOrderItems.value.length > 0;

    console.log(
      "Display items - Cart items:",
      cartItems.value.length,
      "Order items:",
      groupedOrderItems.value.length
    );

    if (hasCartItems) {
      console.log("Displaying cart items:", groupedCartItems.value);
      return groupedCartItems.value;
    } else if (hasOrderItems) {
      console.log("Displaying order items:", groupedOrderItems.value);
      return groupedOrderItems.value;
    }

    return [];
  });

  const orderTotal = computed(() => {
    return ordersWithMeals.value.reduce(
      (total: number, order: OrderWithMeals) =>
        total + (order.total_amount || 0),
      0
    );
  });

  const cartTotal = computed(() => {
    return cartItems.value.reduce(
      (total: number, item: MenuItem) => total + item.price,
      0
    );
  });

  const displayTotal = computed(() => {
    return cartItems.value.length > 0 ? cartTotal.value : orderTotal.value;
  });

  const itemCount = computed(() => {
    return cartItems.value.length > 0
      ? cartItems.value.length
      : ordersWithMeals.value.length;
  });

  // Methods
  const initializeTableId = () => {
    // Ensure table ID is set from query params if available (fallback for direct navigation)
    if (route.query.table && !tableStore.currentTableId) {
      const tableParam = route.query.table;
      const tableValue = Array.isArray(tableParam) ? tableParam[0] : tableParam;
      if (tableValue) {
        const parsedTableId = parseInt(tableValue, 10);
        if (!isNaN(parsedTableId) && parsedTableId > 0) {
          tableStore.setTableId(parsedTableId);
          console.log("Table ID set from query params:", parsedTableId);
        }
      }
    }
    console.log("Current table ID for orders:", tableId.value);
  };

  const loadCartData = () => {
    console.log("=== Loading cart data ===");
    console.log("Route query:", route.query);
    console.log("Route meta:", route.meta);
    console.log("History state:", history.state);

    // Try multiple methods to get cart items
    let cartDataLoaded = false;

    // Method 1: Check sessionStorage for reviewOrderCartItems (primary)
    const storedCartItems = sessionStorage.getItem("reviewOrderCartItems");
    if (storedCartItems) {
      try {
        const parsed = JSON.parse(storedCartItems);
        console.log("Found cart data in reviewOrderCartItems:", parsed);
        cartItems.value = parsed;
        cartDataLoaded = true;
        // Clear from sessionStorage after use
        sessionStorage.removeItem("reviewOrderCartItems");
      } catch (error) {
        console.error("Error parsing reviewOrderCartItems:", error);
      }
    }

    // Method 2: Check sessionStorage for general cartItems (backup)
    if (!cartDataLoaded) {
      const generalCartItems = sessionStorage.getItem("cartItems");
      if (generalCartItems) {
        try {
          const parsed = JSON.parse(generalCartItems);
          console.log("Found cart data in cartItems:", parsed);
          cartItems.value = parsed;
          cartDataLoaded = true;
          // Don't clear this one as it might be used elsewhere
        } catch (error) {
          console.error("Error parsing cartItems:", error);
        }
      }
    }

    // Method 3: Check route meta (fallback)
    if (!cartDataLoaded && route.meta?.cartItems) {
      console.log("Found cart data in route meta:", route.meta.cartItems);
      cartItems.value = route.meta.cartItems as MenuItem[];
      cartDataLoaded = true;
    }

    // Method 4: Check history state (fallback)
    if (!cartDataLoaded && history.state?.cartItems) {
      console.log("Found cart data in history state:", history.state.cartItems);
      cartItems.value = history.state.cartItems;
      cartDataLoaded = true;
    }

    console.log("Final cart items loaded:", cartItems.value);
    console.log("Cart data loaded successfully:", cartDataLoaded);
  };

  const fetchOrdersForTable = async () => {
    try {
      loadingOrders.value = true;
      const currentTableId = tableId.value;
      console.log("Fetching orders for table:", currentTableId);
      const orders = await orderDataStore.getOrdersByTableWithMeals(
        currentTableId
      );
      ordersWithMeals.value = orders;
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      loadingOrders.value = false;
    }
  };

  const createOrder = async () => {
    if (cartItems.value.length === 0) {
      return null;
    }

    const currentTableId = tableId.value;
    console.log(
      "Creating orders for table:",
      currentTableId,
      "with items:",
      cartItems.value
    );

    // Store item count for the waiting page
    sessionStorage.setItem(
      "lastOrderItemCount",
      cartItems.value.length.toString()
    );

    // Create single order with order_items table
    const order = await orderDataStore.createOrderWithItems(
      cartItems.value,
      currentTableId
    );
    console.log("Order created successfully:", order);

    // Clear cart items after successful order creation
    cartItems.value = [];

    // Refresh the orders list to show the new orders
    await fetchOrdersForTable();

    return order;
  };

  const clearCart = () => {
    cartItems.value = [];
  };

  return {
    // State
    loading,
    loadingOrders,
    cartItems,
    ordersWithMeals,

    // Computed
    tableId,
    groupedCartItems,
    groupedOrderItems,
    displayItems,
    orderTotal,
    cartTotal,
    displayTotal,
    itemCount,

    // Methods
    initializeTableId,
    loadCartData,
    fetchOrdersForTable,
    createOrder,
    clearCart,
  };
}
