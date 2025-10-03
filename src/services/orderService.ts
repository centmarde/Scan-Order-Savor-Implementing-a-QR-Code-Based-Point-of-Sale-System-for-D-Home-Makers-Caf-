/**
 * Orders Service
 *
 * Manages order operations with Supabase database
 * Handles order creation, status updates, and retrieval
 */

import { supabase } from "@/lib/supabase";
import type { MenuItem } from "@/stores/menuData";

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

// New interface for order_items table
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
  meal_id?: number; // Back to single ID for main order
  order_items?: OrderItem[]; // For backward compatibility
}

export interface OrderWithMeals extends Order {
  meal?: MenuItem;
  order_items_db?: (OrderItemDB & { meal: MenuItem })[]; // Database order items with meal details
}

export interface CreateOrderData {
  status: Order["status"];
  total_amount: number;
  table_id: number;
  order_items?: OrderItem[];
}

export interface CreateOrderWithMealData {
  status: Order["status"];
  total_amount: number;
  table_id: number;
  meal_id: number;
}

export interface CreateSingleOrderData {
  status: Order["status"];
  total_amount: number;
  table_id: number;
  meal_id: number[]; // Array of meal IDs
}

export interface CreateOrderWithItemsData {
  status: Order["status"];
  total_amount: number;
  table_id: number;
}

/**
 * Create a new order in the database (legacy - with order_items)
 */
export const createOrder = async (
  orderData: CreateOrderData
): Promise<Order> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error("Error creating order:", error);
      throw new Error(`Failed to create order: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Create order error:", error);
    throw error;
  }
};

/**
 * Create a single order with order_items table (recommended approach)
 */
export const createOrderWithItems = async (
  cartItems: MenuItem[],
  tableId: number
): Promise<Order> => {
  try {
    // Calculate total amount
    const totalAmount = cartItems.reduce(
      (total, item) => total + item.price,
      0
    );

    // Create the main order
    const orderData: CreateOrderWithItemsData = {
      status: "pending",
      total_amount: totalAmount,
      table_id: tableId,
    };

    const { data: orderData_result, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

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

    // Create order items
    const orderItemsData: Omit<OrderItemDB, "id" | "created_at">[] =
      Object.values(groupedItems).map(({ item, quantity }) => ({
        order_id: orderData_result.id!,
        meal_id: item.id,
        quantity: quantity,
      }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsData);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Clean up the order if order items failed
      await supabase.from("orders").delete().eq("id", orderData_result.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log(
      "Order and order items created successfully:",
      orderData_result.id
    );
    return orderData_result;
  } catch (error) {
    console.error("Create order with items error:", error);
    throw error;
  }
};

/**
 * Create a single order with multiple meal IDs (JSON array approach - deprecated)
 */
export const createSingleOrderWithMeals = async (
  cartItems: MenuItem[],
  tableId: number
): Promise<Order> => {
  try {
    // Create array of meal IDs (including duplicates for quantities)
    const mealIds = cartItems.map((item) => item.id);

    // Calculate total amount
    const totalAmount = cartItems.reduce(
      (total, item) => total + item.price,
      0
    );

    const orderData: CreateSingleOrderData = {
      status: "pending",
      total_amount: totalAmount,
      table_id: tableId,
      meal_id: mealIds, // Array of meal IDs
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error("Error creating single order with meals:", error);
      throw new Error(`Failed to create order: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Create single order with meals error:", error);
    throw error;
  }
};

/**
 * Create multiple orders with meal_id (original approach - kept for backward compatibility)
 */
export const createOrdersWithMeals = async (
  cartItems: MenuItem[],
  tableId: number
): Promise<Order[]> => {
  try {
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

    // Create separate order records for each meal (or create multiple records for quantity > 1)
    const orderInserts: CreateOrderWithMealData[] = [];

    Object.values(groupedItems).forEach(({ item, quantity }) => {
      // Create separate order records for each quantity
      for (let i = 0; i < quantity; i++) {
        orderInserts.push({
          status: "pending",
          total_amount: item.price,
          table_id: tableId,
          meal_id: item.id,
        });
      }
    });

    const { data, error } = await supabase
      .from("orders")
      .insert(orderInserts)
      .select();

    if (error) {
      console.error("Error creating orders with meals:", error);
      throw new Error(`Failed to create orders: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Create orders with meals error:", error);
    throw error;
  }
};

/**
 * Get an order by ID
 */
export const getOrderById = async (orderId: number): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Error fetching order:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Get order error:", error);
    return null;
  }
};

/**
 * Get an order by ID with meal details
 */
export const getOrderWithMeals = async (
  orderId: number
): Promise<OrderWithMeals[] | null> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        meal:menu(*)
      `
      )
      .eq("id", orderId);

    if (error) {
      console.error("Error fetching order with meals:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Get order with meals error:", error);
    return null;
  }
};

/**
 * Get all orders with meal details for a specific table using order_items table
 */
export const getOrdersByTableWithMeals = async (
  tableId: number
): Promise<OrderWithMeals[]> => {
  try {
    // Fetch orders for the table
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("table_id", tableId)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) return [];

    // Fetch order items with meal details for all orders
    const orderIds = orders.map((order) => order.id);

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
      console.error("Error fetching order items:", itemsError);
      throw new Error(`Failed to fetch order items: ${itemsError.message}`);
    }

    // Create expanded orders (one entry per meal)
    const expandedOrders: OrderWithMeals[] = [];

    orders.forEach((order) => {
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
  } catch (error) {
    console.error("Get orders by table with meals error:", error);
    throw error;
  }
};

/**
 * Get the latest order with meal details for a specific table
 */
export const getLatestOrderByTableWithMeals = async (
  tableId: number
): Promise<OrderWithMeals | null> => {
  try {
    // Fetch the most recent order for the table
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("table_id", tableId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (ordersError) {
      console.error("Error fetching latest order:", ordersError);
      throw new Error(`Failed to fetch latest order: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) return null;

    const latestOrder = orders[0];

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
      console.error("Error fetching order items:", itemsError);
      throw new Error(`Failed to fetch order items: ${itemsError.message}`);
    }

    // Create order with items data
    const orderWithMeals: OrderWithMeals = {
      ...latestOrder,
      order_items_db: orderItems || [],
    };

    return orderWithMeals;
  } catch (error) {
    console.error("Get latest order by table with meals error:", error);
    throw error;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  orderId: number,
  status: Order["status"]
): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Error updating order status:", error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Update order status error:", error);
    throw error;
  }
};

/**
 * Get all orders for a specific table
 */
export const getOrdersByTable = async (tableId: number): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("table_id", tableId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Get orders by table error:", error);
    throw error;
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId: number): Promise<Order | null> => {
  return updateOrderStatus(orderId, "cancelled");
};

/**
 * Convert cart items to order items format
 */
export const convertCartToOrderItems = (cartItems: MenuItem[]): OrderItem[] => {
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

/**
 * Calculate total amount from cart items
 */
export const calculateOrderTotal = (cartItems: MenuItem[]): number => {
  return cartItems.reduce((total, item) => total + item.price, 0);
};

/**
 * Update order feedback
 */
export interface FeedbackData {
  orderIds: number[];
  foodRating: number;
  serviceRating: number;
  comments: string;
}

export const updateOrderFeedback = async (
  feedbackData: FeedbackData
): Promise<void> => {
  try {
    console.log("Updating feedback for orders:", feedbackData.orderIds);

    // Create feedback object
    const feedback = {
      food_rating: feedbackData.foodRating,
      service_rating: feedbackData.serviceRating,
      comments: feedbackData.comments,
      submitted_at: new Date().toISOString(),
    };

    console.log("Feedback object to save:", feedback);

    // Update each order individually to ensure proper error handling
    for (const orderId of feedbackData.orderIds) {
      console.log(`Updating feedback for order ID: ${orderId}`);

      const { data, error } = await supabase
        .from("orders")
        .update({
          feedback: JSON.stringify(feedback),
        })
        .eq("id", orderId)
        .select();

      if (error) {
        console.error(`Error updating feedback for order ${orderId}:`, error);
        throw new Error(
          `Failed to update feedback for order ${orderId}: ${error.message}`
        );
      }

      console.log(`Feedback updated successfully for order ${orderId}:`, data);
    }

    console.log("All feedback updates completed successfully");
  } catch (error) {
    console.error("Error in updateOrderFeedback:", error);
    throw error;
  }
};

/**
 * Update meal sales when order is completed
 */
export const updateMealSales = async (
  orderWithMeals: OrderWithMeals
): Promise<void> => {
  try {
    if (
      !orderWithMeals.order_items_db ||
      orderWithMeals.order_items_db.length === 0
    ) {
      console.log("No order items found to update sales");
      return;
    }

    console.log("Updating meal sales for order:", orderWithMeals.id);

    // Update sales for each meal in the order
    for (const orderItem of orderWithMeals.order_items_db) {
      const mealId = orderItem.meal_id;
      const quantity = orderItem.quantity;

      console.log(`Updating sales for meal ID ${mealId} by ${quantity}`);

      // Get current sales count
      const { data: currentMeal, error: fetchError } = await supabase
        .from("menu")
        .select("sales")
        .eq("id", mealId)
        .single();

      if (fetchError) {
        console.error(`Error fetching meal ${mealId}:`, fetchError);
        continue; // Continue with other meals
      }

      const currentSales = currentMeal?.sales || 0;
      const newSales = currentSales + quantity;

      // Update the sales count
      const { error: updateError } = await supabase
        .from("menu")
        .update({ sales: newSales })
        .eq("id", mealId);

      if (updateError) {
        console.error(`Error updating sales for meal ${mealId}:`, updateError);
        continue; // Continue with other meals
      }

      console.log(
        `Successfully updated sales for meal ${mealId}: ${currentSales} → ${newSales}`
      );
    }

    console.log("All meal sales updates completed successfully");
  } catch (error) {
    console.error("Error in updateMealSales:", error);
    throw error;
  }
};

/**
 * Updated database schema with order_items table:
 *
 * CREATE TABLE orders (
 *   id BIGSERIAL PRIMARY KEY,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
 *   total_amount DECIMAL(10,2) NOT NULL,
 *   table_id INTEGER NOT NULL,
 *   meal_id INTEGER REFERENCES menu(id),  -- Optional, for backward compatibility
 *   feedback TEXT  -- Store feedback as JSON string
 * );
 *
 * CREATE TABLE order_items (
 *   id BIGSERIAL PRIMARY KEY,
 *   order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 *   meal_id BIGINT NOT NULL REFERENCES menu(id) ON DELETE CASCADE,
 *   quantity INTEGER NOT NULL DEFAULT 1,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * -- Add feedback column if it doesn't exist
 * ALTER TABLE orders ADD COLUMN IF NOT EXISTS feedback TEXT;
 *
 * -- Add sales column to menu table if it doesn't exist
 * ALTER TABLE menu ADD COLUMN IF NOT EXISTS sales INTEGER DEFAULT 0;
 *
 * -- Enable Row Level Security (optional)
 * ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
 *
 * -- Create indexes for better performance
 * CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
 * CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
 * CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
 * CREATE INDEX IF NOT EXISTS idx_orders_meal_id ON orders(meal_id);
 *
 * -- Foreign key constraint for meal_id
 * ALTER TABLE orders ADD CONSTRAINT fk_orders_meal_id
 *   FOREIGN KEY (meal_id) REFERENCES menu(id) ON DELETE CASCADE;
 */
