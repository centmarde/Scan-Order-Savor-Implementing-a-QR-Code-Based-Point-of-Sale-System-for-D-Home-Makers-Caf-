/**
 * Orders Service (DEPRECATED - Most functions moved to stores/orderData.ts)
 *
 * MIGRATION NOTICE:
 * Most functions from this service have been moved to stores/orderData.ts for better state management.
 * Please use useOrderDataStore() instead of importing functions from this service.
 *
 * Remaining legacy functions are kept for backward compatibility only.
 * The interfaces in this file are still used but duplicated in orderData.ts.
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

// NOTE: createOrderWithItems has been moved to stores/orderData.ts
// Use useOrderDataStore().createOrderWithItems() instead

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

// NOTE: getOrdersByTableWithMeals has been moved to stores/orderData.ts
// Use useOrderDataStore().getOrdersByTableWithMeals() instead

// NOTE: getLatestOrderByTableWithMeals has been moved to stores/orderData.ts
// Use useOrderDataStore().getLatestOrderByTableWithMeals() instead

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

// NOTE: Utility functions have been moved to stores/orderData.ts
// Use useOrderDataStore().convertCartToOrderItems() and useOrderDataStore().calculateOrderTotal() instead

// NOTE: updateOrderFeedback and FeedbackData interface have been moved to stores/orderData.ts
// Use useOrderDataStore().updateOrderFeedback() and import FeedbackData from stores/orderData.ts instead

// NOTE: updateMealSales has been moved to stores/orderData.ts
// Use useOrderDataStore().updateMealSales() instead

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
 * -- Add or ensure quantity column exists in menu table
 * ALTER TABLE menu ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;
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
