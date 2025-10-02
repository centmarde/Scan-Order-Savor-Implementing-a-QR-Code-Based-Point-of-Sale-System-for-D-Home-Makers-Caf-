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
  order_items?: OrderItem[]; // For backward compatibility
}

export interface OrderWithMeals extends Order {
  meal?: MenuItem;
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
 * Create multiple orders with meal_id (new schema)
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
 * Get all orders with meal details for a specific table
 */
export const getOrdersByTableWithMeals = async (
  tableId: number
): Promise<OrderWithMeals[]> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        meal:menu(*)
      `
      )
      .eq("table_id", tableId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders with meals:", error);
      throw new Error(`Failed to fetch orders with meals: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Get orders by table with meals error:", error);
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
 * Updated database schema for orders table with meal_id:
 *
 * CREATE TABLE orders (
 *   id SERIAL PRIMARY KEY,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
 *   total_amount DECIMAL(10,2) NOT NULL,
 *   table_id INTEGER NOT NULL,
 *   meal_id INTEGER REFERENCES menu(id),
 *   order_items JSONB DEFAULT '[]'::jsonb  -- Optional for backward compatibility
 * );
 *
 * -- Enable Row Level Security (optional)
 * ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
 *
 * -- Create indexes for better performance
 * CREATE INDEX idx_orders_table_id ON orders(table_id);
 * CREATE INDEX idx_orders_status ON orders(status);
 * CREATE INDEX idx_orders_created_at ON orders(created_at);
 * CREATE INDEX idx_orders_meal_id ON orders(meal_id);
 *
 * -- Foreign key constraint for meal_id
 * ALTER TABLE orders ADD CONSTRAINT fk_orders_meal_id
 *   FOREIGN KEY (meal_id) REFERENCES menu(id) ON DELETE CASCADE;
 */
