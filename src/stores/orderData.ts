/**
 * Order Data Store
 *
 * Manages order operations with centralized state management
 * Handles order creation, status updates, retrieval, and feedback
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import type { MenuItem } from "@/stores/menuData";

// Order-related interfaces
export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderItemDB {
  id?: number;
  order_id: number;
  meal_id: number;
  quantity: number;
  created_at?: string;
}

export interface Order {
  id?: number;
  created_at?: string;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  total_amount: number;
  table_id: number;
  meal_id?: number;
  order_items?: OrderItem[];
}

export interface OrderWithMeals extends Order {
  meal?: MenuItem;
  order_items_db?: (OrderItemDB & { meal: MenuItem })[];
}

export interface CreateOrderWithItemsData {
  status: Order["status"];
  total_amount: number;
  table_id: number;
}

export interface FeedbackData {
  orderIds: number[];
  foodRating: number;
  serviceRating: number;
  comments: string;
}

export const useOrderDataStore = defineStore("orderData", () => {
  // State
  const orders = ref<Order[]>([]);
  const currentOrder = ref<OrderWithMeals | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetchTime = ref<Date | null>(null);

  // Getters
  const ordersByStatus = computed(() => {
    return (status: Order["status"]) =>
      orders.value.filter((order) => order.status === status);
  });

  const ordersByTable = computed(() => {
    return (tableId: number) =>
      orders.value.filter((order) => order.table_id === tableId);
  });

  const pendingOrdersCount = computed(() => {
    return orders.value.filter((order) => order.status === "pending").length;
  });

  // Actions
  const clearError = (): void => {
    error.value = null;
  };

  /**
   * Create a new order with items or update existing pending order for the table
   */
  const createOrderWithItems = async (
    cartItems: MenuItem[],
    tableId: number
  ): Promise<Order> => {
    try {
      loading.value = true;
      error.value = null;

      // Group cart items by meal ID and count quantities
      const groupedItems: {
        [key: number]: { item: MenuItem; quantity: number };
      } = {};

      cartItems.forEach((item) => {
        if (groupedItems[item.id]) {
          groupedItems[item.id].quantity += 1;
        } else {
          groupedItems[item.id] = { item, quantity: 1 };
        }
      });

      // Validate inventory availability before creating/updating order
      for (const [mealId, { item, quantity }] of Object.entries(groupedItems)) {
        if (item.quantity !== undefined && item.quantity < quantity) {
          throw new Error(
            `Insufficient stock for "${item.name}". Available: ${item.quantity}, Requested: ${quantity}`
          );
        }
      }

      // Calculate total amount
      const totalAmount = cartItems.reduce(
        (total, item) => total + item.price,
        0
      );

      // Check for existing pending order for this table
      const { data: existingOrder, error: checkError } = await supabase
        .from("orders")
        .select("*")
        .eq("table_id", tableId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Failed to check existing orders: ${checkError.message}`);
      }

      let orderResult: Order;

      if (existingOrder) {
        // Update existing pending order
        console.log(`Updating existing pending order ${existingOrder.id} for table ${tableId}`);

        // Delete existing order items for this order
        const { error: deleteItemsError } = await supabase
          .from("order_items")
          .delete()
          .eq("order_id", existingOrder.id);

        if (deleteItemsError) {
          throw new Error(`Failed to delete existing order items: ${deleteItemsError.message}`);
        }

        // Update the order with new total
        const { data: updatedOrder, error: updateError } = await supabase
          .from("orders")
          .update({
            total_amount: totalAmount,
            created_at: new Date().toISOString() // Update timestamp to reflect new order time
          })
          .eq("id", existingOrder.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update order: ${updateError.message}`);
        }

        orderResult = updatedOrder;
      } else {
        // Create new order
        console.log(`Creating new order for table ${tableId}`);
        const orderData: CreateOrderWithItemsData = {
          status: "pending",
          total_amount: totalAmount,
          table_id: tableId,
        };

        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert(orderData)
          .select()
          .single();

        if (orderError) {
          throw new Error(`Failed to create order: ${orderError.message}`);
        }

        orderResult = newOrder;
      }

      // Create new order items
      const orderItemsData: Omit<OrderItemDB, "id" | "created_at">[] =
        Object.values(groupedItems).map(({ item, quantity }) => ({
          order_id: orderResult.id!,
          meal_id: item.id,
          quantity: quantity,
        }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsData);

      if (itemsError) {
        // Clean up if order items failed
        if (!existingOrder) {
          // Only delete if it's a new order, don't delete existing orders
          await supabase.from("orders").delete().eq("id", orderResult.id);
        }
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }

      // Update local state
      const orderIndex = orders.value.findIndex(order => order.id === orderResult.id);
      if (orderIndex !== -1) {
        // Update existing order in local state
        orders.value[orderIndex] = orderResult;
      } else {
        // Add new order to local state
        orders.value.unshift(orderResult);
      }

      console.log(
        `Order ${existingOrder ? 'updated' : 'created'} successfully:`,
        orderResult.id
      );
      return orderResult;
    } catch (err) {
      console.error("Create/update order with items error:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to create/update order";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get an order by ID
   */
  const getOrderById = async (orderId: number): Promise<Order | null> => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch order: ${fetchError.message}`);
      }

      return data;
    } catch (err) {
      console.error("Get order error:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to fetch order";
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get all orders with meal details for a specific table using order_items table
   */
  const getOrdersByTableWithMeals = async (
    tableId: number
  ): Promise<OrderWithMeals[]> => {
    try {
      loading.value = true;
      error.value = null;

      // Fetch orders for the table
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("table_id", tableId)
        .order("created_at", { ascending: false });

      if (ordersError) {
        throw new Error(`Failed to fetch orders: ${ordersError.message}`);
      }

      if (!ordersData || ordersData.length === 0) return [];

      // Fetch order items with meal details for all orders
      const orderIds = ordersData.map((order) => order.id);

      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(
          `
          *,
          meal:menu(*)
        `
        )
        .in("order_id", orderIds)
        .order("created_at", { ascending: true });

      if (itemsError) {
        throw new Error(`Failed to fetch order items: ${itemsError.message}`);
      }

      // Create expanded orders (one entry per meal)
      const expandedOrders: OrderWithMeals[] = [];

      ordersData.forEach((order) => {
        const orderItemsForOrder =
          orderItems?.filter((item) => item.order_id === order.id) || [];

        if (orderItemsForOrder.length === 0) {
          // Order with no items, add as is
          expandedOrders.push(order);
        } else {
          // Create one entry per meal (considering quantity)
          orderItemsForOrder.forEach((orderItem) => {
            if (orderItem.meal) {
              // Create multiple entries for quantity > 1
              for (let i = 0; i < orderItem.quantity; i++) {
                expandedOrders.push({
                  ...order,
                  meal: orderItem.meal,
                  total_amount: orderItem.meal.price, // Individual meal price
                });
              }
            }
          });
        }
      });

      return expandedOrders;
    } catch (err) {
      console.error("Get orders by table with meals error:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to fetch orders";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get the latest order with meal details for a specific table
   */
  const getLatestOrderByTableWithMeals = async (
    tableId: number
  ): Promise<OrderWithMeals | null> => {
    try {
      loading.value = true;
      error.value = null;

      // Fetch the most recent order for the table
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("table_id", tableId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (ordersError) {
        throw new Error(`Failed to fetch latest order: ${ordersError.message}`);
      }

      if (!ordersData || ordersData.length === 0) return null;

      const latestOrder = ordersData[0];

      // Fetch order items with meal details for this specific order
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(
          `
          *,
          meal:menu(*)
        `
        )
        .eq("order_id", latestOrder.id)
        .order("created_at", { ascending: true });

      if (itemsError) {
        throw new Error(`Failed to fetch order items: ${itemsError.message}`);
      }

      // Create order with items data
      const orderWithMeals: OrderWithMeals = {
        ...latestOrder,
        order_items_db: orderItems || [],
      };

      currentOrder.value = orderWithMeals;
      return orderWithMeals;
    } catch (err) {
      console.error("Get latest order by table with meals error:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to fetch latest order";
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update order status
   */
  const updateOrderStatus = async (
    orderId: number,
    status: Order["status"]
  ): Promise<Order | null> => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: updateError } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId)
        .select()
        .single();

      if (updateError) {
        throw new Error(
          `Failed to update order status: ${updateError.message}`
        );
      }

      // Update local state
      const orderIndex = orders.value.findIndex(
        (order) => order.id === orderId
      );
      if (orderIndex !== -1) {
        orders.value[orderIndex] = { ...orders.value[orderIndex], ...data };
      }

      return data;
    } catch (err) {
      console.error("Update order status error:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to update order status";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Cancel an order
   */
  const cancelOrder = async (orderId: number): Promise<Order | null> => {
    return updateOrderStatus(orderId, "cancelled");
  };

  /**
   * Update order feedback
   */
  const updateOrderFeedback = async (
    feedbackData: FeedbackData
  ): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      console.log("Updating feedback for orders:", feedbackData.orderIds);

      // Create feedback object
      const feedback = {
        food_rating: feedbackData.foodRating,
        service_rating: feedbackData.serviceRating,
        comments: feedbackData.comments,
        submitted_at: new Date().toISOString(),
      };

      // Update each order individually to ensure proper error handling
      for (const orderId of feedbackData.orderIds) {
        const { data, error: updateError } = await supabase
          .from("orders")
          .update({
            feedback: JSON.stringify(feedback),
          })
          .eq("id", orderId)
          .select();

        if (updateError) {
          throw new Error(
            `Failed to update feedback for order ${orderId}: ${updateError.message}`
          );
        }

        // Update local state
        const orderIndex = orders.value.findIndex(
          (order) => order.id === orderId
        );
        if (orderIndex !== -1 && data && data[0]) {
          orders.value[orderIndex] = {
            ...orders.value[orderIndex],
            ...data[0],
          };
        }
      }

      console.log("All feedback updates completed successfully");
    } catch (err) {
      console.error("Error in updateOrderFeedback:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to update feedback";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update meal sales and deduct quantities when order is completed
   */
  const updateMealSales = async (
    orderWithMeals: OrderWithMeals
  ): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      if (
        !orderWithMeals.order_items_db ||
        orderWithMeals.order_items_db.length === 0
      ) {
        console.log("No order items found to update sales and quantities");
        return;
      }

      console.log(
        "Updating meal sales and quantities for order:",
        orderWithMeals.id
      );

      // Update sales and quantities for each meal in the order
      for (const orderItem of orderWithMeals.order_items_db) {
        const mealId = orderItem.meal_id;
        const quantity = orderItem.quantity;

        // Get current sales count and quantity
        const { data: currentMeal, error: fetchError } = await supabase
          .from("menu")
          .select("sales, quantity")
          .eq("id", mealId)
          .single();

        if (fetchError) {
          console.error(`Error fetching meal ${mealId}:`, fetchError);
          continue;
        }

        const currentSales = currentMeal?.sales || 0;
        const currentQuantity = currentMeal?.quantity || 0;
        const newSales = currentSales + quantity;
        const newQuantity = Math.max(0, currentQuantity - quantity);

        // Update both sales count and quantity
        const { error: updateError } = await supabase
          .from("menu")
          .update({
            sales: newSales,
            quantity: newQuantity,
          })
          .eq("id", mealId);

        if (updateError) {
          console.error(
            `Error updating sales and quantity for meal ${mealId}:`,
            updateError
          );
          continue;
        }

        console.log(`Successfully updated meal ${mealId}:`);
        console.log(`  Sales: ${currentSales} → ${newSales}`);
        console.log(`  Quantity: ${currentQuantity} → ${newQuantity}`);

        // Log warnings for stock issues
        if (newQuantity === 0) {
          console.warn(
            `Warning: Meal ${mealId} is now out of stock (quantity: 0)`
          );
        } else if (currentQuantity < quantity) {
          console.warn(
            `Warning: Meal ${mealId} had insufficient stock. Ordered: ${quantity}, Available: ${currentQuantity}`
          );
        }
      }

      console.log("All meal sales and quantity updates completed successfully");
    } catch (err) {
      console.error("Error in updateMealSales:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to update meal sales";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Complete an order and update meal sales/quantities
   * This is a centralized method that should be called whenever an order is completed
   */
  const completeOrderWithInventoryUpdate = async (
    orderId: number,
    tableId: number
  ): Promise<Order | null> => {
    try {
      loading.value = true;
      error.value = null;

      console.log(`Completing order ${orderId} with inventory update...`);

      // Fetch the order with meal details before updating status
      const orderWithMeals = await getLatestOrderByTableWithMeals(tableId);

      // Verify this is the correct order
      if (!orderWithMeals || orderWithMeals.id !== orderId) {
        throw new Error("Order not found or mismatch. Cannot complete order.");
      }

      // Update order status to completed
      const updatedOrder = await updateOrderStatus(orderId, "completed");

      // Update meal sales and deduct quantities
      console.log("Updating meal sales and quantities...");
      await updateMealSales(orderWithMeals);
      console.log("Inventory and sales updated successfully");

      return updatedOrder;
    } catch (err) {
      console.error("Error in completeOrderWithInventoryUpdate:", err);
      error.value =
        err instanceof Error
          ? err.message
          : "Failed to complete order with inventory update";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get all orders for a specific table
   */
  const fetchOrdersByTable = async (tableId: number): Promise<Order[]> => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("table_id", tableId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch orders: ${fetchError.message}`);
      }

      const tableOrders = data || [];

      // Update local state with table-specific orders
      orders.value = tableOrders;
      lastFetchTime.value = new Date();

      return tableOrders;
    } catch (err) {
      console.error("Fetch orders by table error:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to fetch orders";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Utility functions
  const convertCartToOrderItems = (cartItems: MenuItem[]): OrderItem[] => {
    // Group items by ID and calculate quantities
    const grouped: { [key: number]: { item: MenuItem; quantity: number } } = {};

    cartItems.forEach((item) => {
      if (grouped[item.id]) {
        grouped[item.id].quantity += 1;
      } else {
        grouped[item.id] = { item, quantity: 1 };
      }
    });

    // Convert to OrderItem format
    return Object.values(grouped).map(({ item, quantity }) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity,
      image: item.image,
    }));
  };

  const calculateOrderTotal = (cartItems: MenuItem[]): number => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  return {
    // State
    orders,
    currentOrder,
    loading,
    error,
    lastFetchTime,

    // Getters
    ordersByStatus,
    ordersByTable,
    pendingOrdersCount,

    // Actions
    clearError,
    createOrderWithItems,
    getOrderById,
    getOrdersByTableWithMeals,
    getLatestOrderByTableWithMeals,
    updateOrderStatus,
    cancelOrder,
    updateOrderFeedback,
    updateMealSales,
    completeOrderWithInventoryUpdate,
    fetchOrdersByTable,

    // Utilities
    convertCartToOrderItems,
    calculateOrderTotal,
  };
});
