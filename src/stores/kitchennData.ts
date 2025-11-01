/**
 * Kitchen Data Store
 *
 * Manages kitchen-specific operations including:
 * - Viewing preparing orders from cashier
 * - Marking orders as ready
 * - Real-time order updates
 * - Kitchen statistics and metrics
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import type { OrderWithMeals } from "@/stores/orderData";

export const useKitchenDataStore = defineStore("kitchenData", () => {
  // State
  const preparingOrders = ref<OrderWithMeals[]>([]);
  const readyOrders = ref<OrderWithMeals[]>([]);
  const selectedOrder = ref<OrderWithMeals | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Real-time subscription
  let ordersSubscription: any = null;

  // Getters
  const preparingOrdersCount = computed(() => preparingOrders.value.length);
  const readyOrdersCount = computed(() => readyOrders.value.length);
  
  const todayCompletedCount = computed(() => {
    // Count orders that were completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return readyOrders.value.filter((order) => {
      const orderDate = new Date(order.created_at || "");
      return orderDate >= today;
    }).length;
  });

  const averagePrepTime = computed(() => {
    // Calculate average prep time from completed orders
    // This is a placeholder - you can enhance this by tracking actual prep times
    if (readyOrders.value.length === 0) return 0;
    
    const totalMinutes = readyOrders.value.reduce((sum, order) => {
      const created = new Date(order.created_at || "");
      const now = new Date();
      const minutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
      return sum + minutes;
    }, 0);
    
    return Math.round(totalMinutes / readyOrders.value.length);
  });

  // Actions
  const clearError = (): void => {
    error.value = null;
  };

  /**
   * Fetch all kitchen orders (preparing and ready status)
   */
  const fetchKitchenOrders = async (): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      // Fetch preparing orders
      const { data: preparingData, error: preparingError } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "preparing")
        .order("created_at", { ascending: true });

      if (preparingError) throw preparingError;

      // Fetch ready orders
      const { data: readyData, error: readyError } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "ready")
        .order("created_at", { ascending: true });

      if (readyError) throw readyError;

      // Get order IDs for fetching items
      const allOrderIds = [
        ...(preparingData?.map((o) => o.id) || []),
        ...(readyData?.map((o) => o.id) || []),
      ];

      if (allOrderIds.length > 0) {
        // Fetch order items with meal details
        const { data: orderItems, error: itemsError } = await supabase
          .from("order_items")
          .select(`*, meal:menu(*)`)
          .in("order_id", allOrderIds);

        if (itemsError) throw itemsError;

        // Map preparing orders with their items
        preparingOrders.value = (preparingData || []).map((order) => ({
          ...order,
          order_items_db: orderItems?.filter((item) => item.order_id === order.id) || [],
        }));

        // Map ready orders with their items
        readyOrders.value = (readyData || []).map((order) => ({
          ...order,
          order_items_db: orderItems?.filter((item) => item.order_id === order.id) || [],
        }));
      } else {
        preparingOrders.value = [];
        readyOrders.value = [];
      }

      console.log(`Fetched ${preparingOrders.value.length} preparing orders, ${readyOrders.value.length} ready orders`);
    } catch (err) {
      console.error("Error fetching kitchen orders:", err);
      error.value = "Failed to load kitchen orders";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get order details
   */
  const getOrderDetails = (orderId: number): OrderWithMeals | null => {
    const order = 
      preparingOrders.value.find((o) => o.id === orderId) ||
      readyOrders.value.find((o) => o.id === orderId);

    if (order) {
      selectedOrder.value = order;
    }

    return order || null;
  };

  /**
   * Complete order preparation and mark as ready
   * Status changes from 'preparing' to 'ready'
   */
  const completeOrder = async (orderId: number): Promise<boolean> => {
    try {
      loading.value = true;
      error.value = null;

      console.log(`Marking order ${orderId} as ready`);

      const { data, error: updateError } = await supabase
        .from("orders")
        .update({ status: "ready" })
        .eq("id", orderId)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log(`Order ${orderId} marked as ready`);

      // Move order from preparing to ready
      const orderIndex = preparingOrders.value.findIndex(o => o.id === orderId);
      if (orderIndex !== -1) {
        const order = preparingOrders.value[orderIndex];
        order.status = "ready";
        preparingOrders.value.splice(orderIndex, 1);
        readyOrders.value.push(order);
      }

      return true;
    } catch (err) {
      console.error("Error completing order:", err);
      error.value = "Failed to complete order";
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Mark multiple orders as ready at once
   */
  const completeMultipleOrders = async (orderIds: number[]): Promise<boolean> => {
    try {
      loading.value = true;
      error.value = null;

      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "ready" })
        .in("id", orderIds);

      if (updateError) throw updateError;

      // Move orders from preparing to ready
      const completedOrders = preparingOrders.value.filter((o) => 
        orderIds.includes(o.id!)
      );
      
      completedOrders.forEach((order) => {
        order.status = "ready";
      });

      preparingOrders.value = preparingOrders.value.filter(
        (o) => !orderIds.includes(o.id!)
      );
      
      readyOrders.value.push(...completedOrders);

      console.log(`${orderIds.length} orders marked as ready`);
      return true;
    } catch (err) {
      console.error("Error completing multiple orders:", err);
      error.value = "Failed to complete orders";
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get order summary with grouped items
   */
  const getOrderSummary = (order: OrderWithMeals) => {
    if (!order.order_items_db || order.order_items_db.length === 0) {
      return { items: [], total: 0, itemCount: 0 };
    }

    const items = order.order_items_db.map((item) => ({
      meal: item.meal,
      quantity: item.quantity,
      subtotal: item.meal.price * item.quantity,
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return { items, total, itemCount };
  };

  /**
   * Setup real-time subscription for kitchen orders
   */
  const subscribeToOrders = (): void => {
    // Unsubscribe from previous subscription if exists
    if (ordersSubscription) {
      ordersSubscription.unsubscribe();
    }

    ordersSubscription = supabase
      .channel("kitchen_orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: "status=in.(preparing,ready)",
        },
        async (payload) => {
          console.log("Kitchen order change detected:", payload);
          
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            // Refresh kitchen orders on insert or update
            await fetchKitchenOrders();
          } else if (payload.eventType === "DELETE") {
            // Remove deleted order from lists
            preparingOrders.value = preparingOrders.value.filter(
              (o) => o.id !== payload.old.id
            );
            readyOrders.value = readyOrders.value.filter(
              (o) => o.id !== payload.old.id
            );
          }
        }
      )
      .subscribe();

    console.log("Subscribed to real-time kitchen order updates");
  };

  /**
   * Unsubscribe from real-time updates
   */
  const unsubscribeFromOrders = (): void => {
    if (ordersSubscription) {
      ordersSubscription.unsubscribe();
      ordersSubscription = null;
      console.log("Unsubscribed from kitchen order updates");
    }
  };

  return {
    // State
    preparingOrders,
    readyOrders,
    selectedOrder,
    loading,
    error,

    // Getters
    preparingOrdersCount,
    readyOrdersCount,
    todayCompletedCount,
    averagePrepTime,

    // Actions
    clearError,
    fetchKitchenOrders,
    getOrderDetails,
    completeOrder,
    completeMultipleOrders,
    getOrderSummary,
    subscribeToOrders,
    unsubscribeFromOrders,
  };
});