/**
 * Sales Data Store
 *
 * Manages sales analytics and reporting including:
 * - Revenue tracking and trends
 * - Order statistics
 * - Top selling items
 * - Category performance
 * - Sales reports and exports
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import type { OrderWithMeals } from "@/stores/orderData";

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

export interface TopSellingItem {
  id: number;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  image?: string;
}

export interface CategorySales {
  name: string;
  itemsSold: number;
  revenue: number;
  avgPrice: number;
  percentage: number;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export const useSalesDataStore = defineStore("salesData", () => {
  // State
  const salesSummary = ref<SalesSummary>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalItemsSold: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
  });

  const topSellingItems = ref<TopSellingItem[]>([]);
  const categorySales = ref<CategorySales[]>([]);
  const salesTrend = ref<SalesTrendPoint[]>([]);
  const recentOrders = ref<any[]>([]);

  const loading = ref(false);
  const error = ref<string | null>(null);

  const currentPeriod = ref<string>("today");
  const startDate = ref<string>("");
  const endDate = ref<string>("");

  // Actions
  const clearError = (): void => {
    error.value = null;
  };

  /**
   * Get date range for different periods
   */
  const getDateRange = (period: "today" | "week" | "month" | "year"): [Date, Date] => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case "today":
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start.setDate(end.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case "month":
        start.setMonth(end.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        break;
      case "year":
        start.setFullYear(end.getFullYear() - 1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return [start, end];
  };

  /**
   * Fetch sales data for a specific period
   */
  const fetchSalesData = async (period: "today" | "week" | "month" | "year"): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;
      currentPeriod.value = period;

      const [start, end] = getDateRange(period);
      startDate.value = start.toISOString();
      endDate.value = end.toISOString();

      await Promise.all([
        fetchSalesSummary(start, end),
        fetchTopSellingItems(start, end),
        fetchCategorySales(start, end),
        fetchSalesTrend(start, end, period),
        fetchRecentOrders(20),
      ]);

    } catch (err) {
      console.error("Error fetching sales data:", err);
      error.value = "Failed to load sales data";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Fetch sales data by custom date range
   */
  const fetchSalesDataByRange = async (from: string, to: string): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      const start = new Date(from);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      console.log('Store: fetchSalesDataByRange called with:', {
        from,
        to,
        start,
        end,
        startISO: start.toISOString(),
        endISO: end.toISOString()
      });

      startDate.value = start.toISOString();
      endDate.value = end.toISOString();

      await Promise.all([
        fetchSalesSummary(start, end),
        fetchTopSellingItems(start, end),
        fetchCategorySales(start, end),
        fetchSalesTrend(start, end, "custom"),
        fetchRecentOrders(20),
      ]);

      console.log('Store: Data fetched successfully, salesSummary:', salesSummary.value);

    } catch (err) {
      console.error("Error fetching sales data by range:", err);
      error.value = "Failed to load sales data";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Fetch sales summary with growth comparison
   */
  const fetchSalesSummary = async (start: Date, end: Date): Promise<void> => {
    try {
      console.log('fetchSalesSummary called with:', {
        start: start.toISOString(),
        end: end.toISOString()
      });

      // Fetch current period orders
      const { data: currentOrders, error: currentError } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["completed", "ready"])
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      console.log('Database query result:', {
        currentOrders: currentOrders,
        currentError: currentError,
        ordersCount: currentOrders?.length || 0
      });

      if (currentError) throw currentError;

      // Calculate period length for comparison
      const periodLength = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodLength);
      const previousEnd = new Date(start.getTime());

      // Fetch previous period for growth comparison
      const { data: previousOrders, error: previousError } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["completed", "ready"])
        .gte("created_at", previousStart.toISOString())
        .lte("created_at", previousEnd.toISOString());

      if (previousError) throw previousError;

      // Calculate current metrics
      const totalRevenue = currentOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const totalOrders = currentOrders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Fetch total items sold
      const orderIds = currentOrders?.map(o => o.id) || [];
      let totalItemsSold = 0;

      if (orderIds.length > 0) {
        const { data: items } = await supabase
          .from("order_items")
          .select("quantity")
          .in("order_id", orderIds);

        totalItemsSold = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      }

      // Calculate previous metrics
      const previousRevenue = previousOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const previousOrderCount = previousOrders?.length || 0;

      // Calculate growth percentages
      const revenueGrowth = previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;
      const ordersGrowth = previousOrderCount > 0
        ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100
        : 0;

      salesSummary.value = {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalItemsSold,
        revenueGrowth,
        ordersGrowth,
      };

    } catch (err) {
      console.error("Error fetching sales summary:", err);
      throw err;
    }
  };

  /**
   * Fetch top selling items
   */
  const fetchTopSellingItems = async (start: Date, end: Date, limit = 10): Promise<void> => {
    try {
      // Get orders in period
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .in("status", ["completed", "ready"])
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (!orders || orders.length === 0) {
        topSellingItems.value = [];
        return;
      }

      const orderIds = orders.map(o => o.id);

      // Get order items with meal details
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*, meal:menu(*)")
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      // Aggregate by meal
      const mealSales = new Map<number, TopSellingItem>();

      items?.forEach((item) => {
        const mealId = item.meal_id;
        if (!mealSales.has(mealId)) {
          mealSales.set(mealId, {
            id: mealId,
            name: item.meal.name,
            category: item.meal.category,
            quantitySold: 0,
            revenue: 0,
            image: item.meal.image,
          });
        }

        const sale = mealSales.get(mealId)!;
        sale.quantitySold += item.quantity;
        sale.revenue += item.meal.price * item.quantity;
      });

      // Sort by revenue and limit
      topSellingItems.value = Array.from(mealSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

    } catch (err) {
      console.error("Error fetching top selling items:", err);
      throw err;
    }
  };

  /**
   * Fetch category sales breakdown
   */
  const fetchCategorySales = async (start: Date, end: Date): Promise<void> => {
    try {
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .in("status", ["completed", "ready"])
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (!orders || orders.length === 0) {
        categorySales.value = [];
        return;
      }

      const orderIds = orders.map(o => o.id);

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*, meal:menu(*)")
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      // Aggregate by category
      const categoryMap = new Map<string, CategorySales>();
      let totalRevenue = 0;

      items?.forEach((item) => {
        const category = item.meal.category || "Uncategorized";
        const revenue = item.meal.price * item.quantity;
        totalRevenue += revenue;

        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            name: category,
            itemsSold: 0,
            revenue: 0,
            avgPrice: 0,
            percentage: 0,
          });
        }

        const catData = categoryMap.get(category)!;
        catData.itemsSold += item.quantity;
        catData.revenue += revenue;
      });

      // Calculate percentages and averages
      categorySales.value = Array.from(categoryMap.values()).map((cat) => ({
        ...cat,
        avgPrice: cat.itemsSold > 0 ? cat.revenue / cat.itemsSold : 0,
        percentage: totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0,
      })).sort((a, b) => b.revenue - a.revenue);

    } catch (err) {
      console.error("Error fetching category sales:", err);
      throw err;
    }
  };

  /**
   * Fetch sales trend data
   */
  const fetchSalesTrend = async (
    start: Date,
    end: Date,
    period: string
  ): Promise<void> => {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("created_at, total_amount")
        .in("status", ["completed", "ready"])
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: true });

      if (ordersError) throw ordersError;

      // Group by date
      const trendMap = new Map<string, SalesTrendPoint>();

      orders?.forEach((order) => {
        const date = new Date(order.created_at).toISOString().split("T")[0];

        if (!trendMap.has(date)) {
          trendMap.set(date, {
            date,
            revenue: 0,
            orders: 0,
          });
        }

        const point = trendMap.get(date)!;
        point.revenue += order.total_amount;
        point.orders += 1;
      });

      salesTrend.value = Array.from(trendMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

    } catch (err) {
      console.error("Error fetching sales trend:", err);
      throw err;
    }
  };

  /**
   * Fetch recent orders
   */
  const fetchRecentOrders = async (limit = 20): Promise<void> => {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["completed", "ready"])
        .order("created_at", { ascending: false })
        .limit(limit);

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        recentOrders.value = [];
        return;
      }

      const orderIds = orders.map(o => o.id);

      // Get order items count
      const { data: items } = await supabase
        .from("order_items")
        .select("order_id, quantity")
        .in("order_id", orderIds);

      // Map orders with item counts
      recentOrders.value = orders.map((order) => {
        const orderItems = items?.filter(i => i.order_id === order.id) || [];
        const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

        return {
          ...order,
          itemCount,
        };
      });

    } catch (err) {
      console.error("Error fetching recent orders:", err);
      throw err;
    }
  };

  /**
   * Export sales report to CSV
   */
  const exportSalesReport = (): string => {
    const headers = [
      "Metric",
      "Value",
    ];

    const summaryRows = [
      ["Period", currentPeriod.value],
      ["Start Date", startDate.value],
      ["End Date", endDate.value],
      ["Total Revenue", salesSummary.value.totalRevenue.toString()],
      ["Total Orders", salesSummary.value.totalOrders.toString()],
      ["Average Order Value", salesSummary.value.averageOrderValue.toString()],
      ["Total Items Sold", salesSummary.value.totalItemsSold.toString()],
      ["Revenue Growth %", salesSummary.value.revenueGrowth.toFixed(2)],
      ["Orders Growth %", salesSummary.value.ordersGrowth.toFixed(2)],
      [""],
      ["Top Selling Items", ""],
      ["Rank", "Name", "Category", "Quantity Sold", "Revenue"],
    ];

    const topItemsRows = topSellingItems.value.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.category,
      item.quantitySold.toString(),
      item.revenue.toString(),
    ]);

    const categoryRows = [
      [""],
      ["Category Sales", ""],
      ["Category", "Items Sold", "Revenue", "Avg Price", "% of Total"],
    ];

    const categorySalesRows = categorySales.value.map((cat) => [
      cat.name,
      cat.itemsSold.toString(),
      cat.revenue.toString(),
      cat.avgPrice.toFixed(2),
      cat.percentage.toFixed(2),
    ]);

    const allRows = [
      headers,
      ...summaryRows,
      ...topItemsRows,
      ...categoryRows,
      ...categorySalesRows,
    ];

    return allRows.map(row => row.join(",")).join("\n");
  };

  /**
   * Get sales comparison between two periods
   */
  const comparePeriods = async (
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ): Promise<{
    period1: SalesSummary;
    period2: SalesSummary;
    comparison: {
      revenueDiff: number;
      ordersDiff: number;
      avgOrderValueDiff: number;
    };
  }> => {
    try {
      // Fetch period 1 data
      const { data: orders1 } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["completed", "ready"])
        .gte("created_at", period1Start.toISOString())
        .lte("created_at", period1End.toISOString());

      // Fetch period 2 data
      const { data: orders2 } = await supabase
        .from("orders")
        .select("*")
        .in("status", ["completed", "ready"])
        .gte("created_at", period2Start.toISOString())
        .lte("created_at", period2End.toISOString());

      const revenue1 = orders1?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const revenue2 = orders2?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const count1 = orders1?.length || 0;
      const count2 = orders2?.length || 0;

      const period1 = {
        totalRevenue: revenue1,
        totalOrders: count1,
        averageOrderValue: count1 > 0 ? revenue1 / count1 : 0,
        totalItemsSold: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
      };

      const period2 = {
        totalRevenue: revenue2,
        totalOrders: count2,
        averageOrderValue: count2 > 0 ? revenue2 / count2 : 0,
        totalItemsSold: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
      };

      return {
        period1,
        period2,
        comparison: {
          revenueDiff: revenue1 - revenue2,
          ordersDiff: count1 - count2,
          avgOrderValueDiff: period1.averageOrderValue - period2.averageOrderValue,
        },
      };

    } catch (err) {
      console.error("Error comparing periods:", err);
      throw err;
    }
  };

  return {
    // State
    salesSummary,
    topSellingItems,
    categorySales,
    salesTrend,
    recentOrders,
    loading,
    error,

    // Actions
    clearError,
    fetchSalesData,
    fetchSalesDataByRange,
    exportSalesReport,
    comparePeriods,
  };
});
