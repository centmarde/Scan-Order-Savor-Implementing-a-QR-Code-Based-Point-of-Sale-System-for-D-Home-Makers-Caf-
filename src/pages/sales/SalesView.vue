<script setup lang="ts">
import { ref, computed, onMounted, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { useSalesDataStore } from "@/stores/salesDatas";
import InnerLayoutWrapper from "@/layouts/InnerLayoutWrapper.vue";
import SalesSummaryCards from "./components/SalesSummaryCards.vue";
import SalesChartsRow from "./components/SalesChartsRow.vue";
import TopSellingItems from "./components/TopSellingItems.vue";
import RecentOrders from "./components/RecentOrders.vue";
import CategorySalesDetails from "./components/CategorySalesDetails.vue";


const router = useRouter();
const salesStore = useSalesDataStore();

// State
const selectedPeriod = ref<string>("custom");
const dateRange = shallowRef<[Date, Date] | null>(null);
const appliedDateRange = shallowRef<[Date, Date] | null>(null);
const showFilters = ref(false);
const selectedCategory = ref<string>("all");



// Computed
const loading = computed(() => salesStore.loading);
const salesSummary = computed(() => salesStore.salesSummary);
const topSellingItems = computed(() => salesStore.topSellingItems);
const salesTrend = computed(() => salesStore.salesTrend);
const categorySales = computed(() => salesStore.categorySales);

const recentOrdersLimited = computed(() => {
  // Filter orders by applied date range
  let orders = salesStore.recentOrders;

  if (appliedDateRange.value && appliedDateRange.value.length >= 2) {
    const startDate = new Date(appliedDateRange.value[0]);
    const endDate = new Date(appliedDateRange.value[1]);

    // Set time to start and end of day for proper comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    orders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  // Return only the first 5 orders
  return orders.slice(0, 5);
});

const periodLabel = computed(() => {
  console.log('=== periodLabel COMPUTING ===');
  console.log('appliedDateRange.value:', appliedDateRange.value);

  if (appliedDateRange.value && appliedDateRange.value.length >= 2) {
    const firstDate = appliedDateRange.value[0];
    const lastDate = appliedDateRange.value[1];
    console.log('appliedDateRange[0] (start):', firstDate);
    console.log('appliedDateRange[1] (end):', lastDate);

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    const fromDateStr = firstDate.toLocaleDateString('en-US', formatOptions);
    const toDateStr = lastDate.toLocaleDateString('en-US', formatOptions);
    const result = `${fromDateStr} to ${toDateStr}`;

    console.log('periodLabel result:', result);
    return result;
  }
  console.log('periodLabel returning: Custom');
  return "Custom";
});

// Methods
const setPeriod = async (period: string): Promise<void> => {
  selectedPeriod.value = period;
  dateRange.value = null;
  await salesStore.fetchSalesData(period as any);
};

const applyDateRange = async (): Promise<void> => {
  if (dateRange.value && dateRange.value.length >= 2) {
    console.log('=== applyDateRange START ===');
    console.log('Raw dateRange.value:', dateRange.value);
    console.log('Array length:', dateRange.value.length);
    console.log('First date [0]:', dateRange.value[0], 'Type:', typeof dateRange.value[0]);
    console.log('Last date [length-1]:', dateRange.value[dateRange.value.length - 1], 'Type:', typeof dateRange.value[dateRange.value.length - 1]);

    // Get first and last dates from the range array
    const startDate = new Date(dateRange.value[0]);
    const endDate = new Date(dateRange.value[dateRange.value.length - 1]);
    console.log('After new Date() conversion:');
    console.log('startDate:', startDate, startDate.toISOString());
    console.log('endDate:', endDate, endDate.toISOString());

    // Ensure dates are in correct order
    const [start, end] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];

    // Store the applied date range for display purposes
    appliedDateRange.value = [new Date(start), new Date(end)];

    console.log('appliedDateRange.value SET TO:', appliedDateRange.value);
    console.log('appliedDateRange[0]:', appliedDateRange.value[0].toISOString());
    console.log('appliedDateRange[1]:', appliedDateRange.value[1].toISOString());

    // Format dates for API call
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];

    console.log('API call strings:', {
      startDate: startDateStr,
      endDate: endDateStr,
      daysDifference: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    });

    await salesStore.fetchSalesDataByRange(startDateStr, endDateStr);
    selectedPeriod.value = "custom";

    console.log('After API call - appliedDateRange.value:', appliedDateRange.value);
    console.log('=== applyDateRange END ===');
  }
};

const onDateRangeChange = (range: [Date, Date] | null) => {
  console.log('=== onDateRangeChange CALLED ===');
  console.log('Received range:', range);
  if (range) {
    console.log('range[0]:', range[0], 'Type:', typeof range[0]);
    console.log('range[1]:', range[1], 'Type:', typeof range[1]);
  }

  dateRange.value = range;
  console.log('dateRange.value SET TO:', dateRange.value);
  console.log('=== onDateRangeChange END ===');
};

const exportReport = (): void => {
  const csv = salesStore.exportSalesReport();
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sales-report-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};





// Lifecycle
onMounted(async () => {
  // Only load default data if no date range is set
  if (!dateRange.value || dateRange.value.length < 2) {
    // Start with today's data as default
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    await salesStore.fetchSalesDataByRange(startDate, endDate);
  }
});
</script>

<template>
  <InnerLayoutWrapper>
    <template #content>
      <v-container fluid class="pa-4">
        <!-- Header -->
        <v-row>
          <v-col cols="12">
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <h1 class="text-h4 font-weight-bold">Sales Dashboard</h1>
                <p class="text-subtitle-1 text-grey">
                  Track revenue, orders, and performance
                </p>
              </div>
              <div class="d-flex gap-2">
              <!--   <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-filter"
                  @click="showFilters = !showFilters"
                >
                  Filters
                </v-btn> -->
                <v-btn
                  color="success"
                  prepend-icon="mdi-download"
                  @click="exportReport"
                >
                  Export Report
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Period Selector -->
        <v-row class="mb-4">
          <v-col cols="12">
            <v-card>
              <v-card-text>
                <div class="d-flex align-center gap-2">
                  <div class="d-flex align-center gap-2">
                    <!-- Date Range Picker -->
                    <v-date-input
                      v-model="dateRange"
                      label="Date Range"
                      multiple="range"
                      variant="outlined"
                      density="compact"
                      hide-details

                      :max="new Date()"
                      style="min-width: 300px;"
                      @update:model-value="onDateRangeChange"
                    ></v-date-input>

                    <!-- Apply Button -->
                    <v-btn
                      color="primary"
                      variant="flat"
                      @click="applyDateRange"
                      :disabled="!dateRange || dateRange.length < 2"
                    >
                      Apply
                    </v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Summary Cards -->
        <SalesSummaryCards
          :sales-summary="salesSummary"
          :date-range="appliedDateRange"
          :period-label="periodLabel"
        />

        <!-- Charts Row -->
        <SalesChartsRow
          :sales-trend="salesTrend"
          :category-sales="categorySales"
          :period-label="periodLabel"
          :date-range="appliedDateRange"
        />

        <!-- Top Selling Items and Recent Orders -->
        <v-row class="mb-4">
          <TopSellingItems
            :top-selling-items="topSellingItems"
            :period-label="periodLabel"
            :date-range="appliedDateRange"
          />
          <RecentOrders
            :recent-orders-limited="recentOrdersLimited"
            :date-range="appliedDateRange"
            :period-label="periodLabel"
          />
        </v-row>

        <!-- Category Sales Details -->
        <CategorySalesDetails
          :category-sales="categorySales"
          :date-range="appliedDateRange"
          :period-label="periodLabel"
        />
      </v-container>
    </template>
  </InnerLayoutWrapper>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}

/* Enhanced date picker styling */
.v-date-picker :deep(.v-date-picker-month__day) {
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.v-date-picker :deep(.v-date-picker-month__day:hover:not(.v-date-picker-month__day--disabled)) {
  background-color: rgba(var(--v-theme-primary), 0.08);
  transform: scale(1.02);
}
</style>
