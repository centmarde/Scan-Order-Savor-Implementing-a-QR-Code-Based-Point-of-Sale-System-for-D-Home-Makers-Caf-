import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";

// Interface for menu items
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  quantity: number;
  sales: number;
  created_at: string;
}

// Interface for order items
interface OrderItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  created_at: string;
  menu?: MenuItem;
}

export const useOrderItems = () => {
  const orderItems = ref<OrderItem[]>([]);
  const loading = ref(false);

  const fetchOrderItems = async () => {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from("order_items")
        .select(
          `
          *,
          menu:meal_id (
            id,
            name,
            category,
            price,
            image
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching order items:", error);
        return;
      }

      orderItems.value = data || [];
    } catch (error) {
      console.error("Error in fetchOrderItems:", error);
    } finally {
      loading.value = false;
    }
  };

  const getFilteredOrderItems = (period: string) => {
    const now = new Date();
    let startDate = new Date();

    if (period === "day") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
    }

    return orderItems.value.filter((item) => {
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate;
    });
  };

  const getPeriodTotalSales = (period: string) => {
    const filteredItems = getFilteredOrderItems(period);
    return filteredItems.reduce((total, item) => total + item.quantity, 0);
  };

  return {
    orderItems,
    loading,
    fetchOrderItems,
    getFilteredOrderItems,
    getPeriodTotalSales,
  };
};
