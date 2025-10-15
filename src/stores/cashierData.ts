/**
 * Cashier Data Store
 *
 * Manages cashier-specific operations including:
 * - Viewing pending orders from customers
 * - Approving/rejecting orders
 * - Order history with filtering
 * - Real-time order updates
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import type { MenuItem } from "@/stores/menuData";
import type { OrderWithMeals } from "@/stores/orderData";

export interface CashierOrderFilters {
  status: string;
  tableNumber: string;
  dateFrom: string | null;
  dateTo: string | null;
  searchQuery: string;
}

export interface OrderHistoryItem extends OrderWithMeals {
  table_number?: number;
  itemCount?: number;
  processedAt?: string;
}

export const useCashierDataStore = defineStore("cashierData", () => {
  // State
  const pendingOrders = ref<OrderWithMeals[]>([]);
  const orderHistory = ref<OrderHistoryItem[]>([]);
  const selectedOrder = ref<OrderWithMeals | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<CashierOrderFilters>({
    status: "all",
    tableNumber: "",
    dateFrom: null,
    dateTo: null,
    searchQuery: "",
  });

  // Real-time subscription
  let ordersSubscription: any = null;

  // Getters
  const pendingOrdersCount = computed(() => pendingOrders.value.length);

  const filteredOrderHistory = computed(() => {
    let filtered = [...orderHistory.value];

    // Filter by status
    if (filters.value.status !== "all") {
      filtered = filtered.filter((order) => order.status === filters.value.status);
    }

    // Filter by table number
    if (filters.value.tableNumber) {
      const tableNum = parseInt(filters.value.tableNumber);
      filtered = filtered.filter((order) => order.table_id === tableNum);
    }

    // Filter by date range
    if (filters.value.dateFrom) {
      const fromDate = new Date(filters.value.dateFrom);
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.created_at || "");
        return orderDate >= fromDate;
      });
    }

    if (filters.value.dateTo) {
      const toDate = new Date(filters.value.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.created_at || "");
        return orderDate <= toDate;
      });
    }

    // Filter by search query
    if (filters.value.searchQuery) {
      const query = filters.value.searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderItems = order.order_items_db || [];
        const itemNames = orderItems
          .map((item) => item.meal?.name || "")
          .join(" ")
          .toLowerCase();
        
        return (
          order.id?.toString().includes(query) ||
          order.table_id?.toString().includes(query) ||
          itemNames.includes(query)
        );
      });
    }

    return filtered;
  });

  const ordersByStatus = computed(() => {
    return (status: string) =>
      orderHistory.value.filter((order) => order.status === status);
  });

  const todayOrdersCount = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orderHistory.value.filter((order) => {
      const orderDate = new Date(order.created_at || "");
      return orderDate >= today;
    }).length;
  });

  const todayRevenue = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orderHistory.value
      .filter((order) => {
        const orderDate = new Date(order.created_at || "");
        return orderDate >= today && order.status === "completed";
      })
      .reduce((total, order) => total + (order.total_amount || 0), 0);
  });

  // Actions
  const clearError = (): void => {
    error.value = null;
  };

  const setFilters = (newFilters: Partial<CashierOrderFilters>): void => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const resetFilters = (): void => {
    filters.value = {
      status: "all",
      tableNumber: "",
      dateFrom: null,
      dateTo: null,
      searchQuery: "",
    };
  };

  /**
   * Fetch all pending orders awaiting cashier approval
   */
  const fetchPendingOrders = async (): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        pendingOrders.value = [];
        return;
      }

      // Fetch order items with meal details
      const orderIds = ordersData.map((order) => order.id);
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`*, meal:menu(*)`)
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      // Map orders with their items
      pendingOrders.value = ordersData.map((order) => ({
        ...order,
        order_items_db: orderItems?.filter((item) => item.order_id === order.id) || [],
      }));

      console.log(`Fetched ${pendingOrders.value.length} pending orders`);
    } catch (err) {
      console.error("Error fetching pending orders:", err);
      error.value = "Failed to load pending orders";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Fetch order history with optional filters
   */
  const fetchOrderHistory = async (limit = 100): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      let query = supabase
        .from("orders")
        .select("*")
        .neq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(limit);

      const { data: ordersData, error: ordersError } = await query;

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        orderHistory.value = [];
        return;
      }

      // Fetch order items with meal details
      const orderIds = ordersData.map((order) => order.id);
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`*, meal:menu(*)`)
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      // Map orders with their items and additional info
      orderHistory.value = ordersData.map((order) => {
        const items = orderItems?.filter((item) => item.order_id === order.id) || [];
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

        return {
          ...order,
          order_items_db: items,
          itemCount,
          table_number: order.table_id,
          processedAt: order.created_at,
        };
      });

      console.log(`Fetched ${orderHistory.value.length} orders in history`);
    } catch (err) {
      console.error("Error fetching order history:", err);
      error.value = "Failed to load order history";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get order details with items summary
   */
  const getOrderDetails = (orderId: number): OrderWithMeals | null => {
    const order = 
      pendingOrders.value.find((o) => o.id === orderId) ||
      orderHistory.value.find((o) => o.id === orderId);

    if (order) {
      selectedOrder.value = order;
    }

    return order || null;
  };

  /**
   * Approve order and send to kitchen
   */
  const approveOrder = async (orderId: number): Promise<boolean> => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: updateError } = await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", orderId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Remove from pending orders
      pendingOrders.value = pendingOrders.value.filter((o) => o.id !== orderId);

      console.log(`Order ${orderId} approved and sent to kitchen`);
      return true;
    } catch (err) {
      console.error("Error approving order:", err);
      error.value = "Failed to approve order";
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Reject/Cancel order
   */
  const rejectOrder = async (orderId: number, reason?: string): Promise<boolean> => {
    try {
      loading.value = true;
      error.value = null;

      const updateData: any = { status: "cancelled" };
      if (reason) {
        updateData.cancellation_reason = reason;
      }

      const { data, error: updateError } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Remove from pending orders
      pendingOrders.value = pendingOrders.value.filter((o) => o.id !== orderId);

      console.log(`Order ${orderId} rejected/cancelled`);
      return true;
    } catch (err) {
      console.error("Error rejecting order:", err);
      error.value = "Failed to reject order";
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Approve multiple orders at once
   */
  const approveMultipleOrders = async (orderIds: number[]): Promise<boolean> => {
    try {
      loading.value = true;
      error.value = null;

      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .in("id", orderIds);

      if (updateError) throw updateError;

      // Remove from pending orders
      pendingOrders.value = pendingOrders.value.filter(
        (o) => !orderIds.includes(o.id!)
      );

      console.log(`${orderIds.length} orders approved`);
      return true;
    } catch (err) {
      console.error("Error approving multiple orders:", err);
      error.value = "Failed to approve orders";
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Setup real-time subscription for pending orders
   */
  const subscribeToOrders = (): void => {
    // Unsubscribe from previous subscription if exists
    if (ordersSubscription) {
      ordersSubscription.unsubscribe();
    }

    ordersSubscription = supabase
      .channel("cashier_orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: "status=eq.pending",
        },
        async (payload) => {
          console.log("Order change detected:", payload);
          
          if (payload.eventType === "INSERT") {
            // New pending order
            await fetchPendingOrders();
          } else if (payload.eventType === "UPDATE") {
            // Order status changed
            await fetchPendingOrders();
          } else if (payload.eventType === "DELETE") {
            // Order deleted
            pendingOrders.value = pendingOrders.value.filter(
              (o) => o.id !== payload.old.id
            );
          }
        }
      )
      .subscribe();

    console.log("Subscribed to real-time order updates");
  };

  /**
   * Unsubscribe from real-time updates
   */
  const unsubscribeFromOrders = (): void => {
    if (ordersSubscription) {
      ordersSubscription.unsubscribe();
      ordersSubscription = null;
      console.log("Unsubscribed from order updates");
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
   * Export order history to CSV
   */
  const exportOrderHistory = (): string => {
    const headers = ["Order ID", "Table", "Status", "Items", "Total", "Date"];
    const rows = filteredOrderHistory.value.map((order) => {
      const summary = getOrderSummary(order);
      const itemsList = summary.items
        .map((item) => `${item.meal.name} x${item.quantity}`)
        .join("; ");
      
      return [
        order.id,
        order.table_id,
        order.status,
        itemsList,
        order.total_amount,
        new Date(order.created_at || "").toLocaleString(),
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  };

  return {
    // State
    pendingOrders,
    orderHistory,
    selectedOrder,
    loading,
    error,
    filters,

    // Getters
    pendingOrdersCount,
    filteredOrderHistory,
    ordersByStatus,
    todayOrdersCount,
    todayRevenue,

    // Actions
    clearError,
    setFilters,
    resetFilters,
    fetchPendingOrders,
    fetchOrderHistory,
    getOrderDetails,
    approveOrder,
    rejectOrder,
    approveMultipleOrders,
    subscribeToOrders,
    unsubscribeFromOrders,
    getOrderSummary,
    exportOrderHistory,
  };
});