<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSalesDataStore } from "@/stores/salesDatas";
import { formatCurrency } from "@/utils/helpers";
import InnerLayoutWrapper from "@/layouts/InnerLayoutWrapper.vue";
import SalesSummaryCards from "./components/SalesSummaryCards.vue";
import SalesChartsRow from "./components/SalesChartsRow.vue";
import TopSellingItems from "./components/TopSellingItems.vue";
import RecentOrders from "./components/RecentOrders.vue";
import CategorySalesDetails from "./components/CategorySalesDetails.vue";


const router = useRouter();
const salesStore = useSalesDataStore();

// State
const selectedPeriod = ref<"today" | "week" | "month" | "year">("today");
const fromDate = ref<Date | null>(null);
const toDate = ref<Date | null>(null);
const fromDateMenu = ref(false);
const toDateMenu = ref(false);
const showFilters = ref(false);
const selectedCategory = ref<string>("all");



// Computed
const loading = computed(() => salesStore.loading);
const salesSummary = computed(() => salesStore.salesSummary);
const topSellingItems = computed(() => salesStore.topSellingItems);
const salesTrend = computed(() => salesStore.salesTrend);
const categorySales = computed(() => salesStore.categorySales);

const recentOrdersLimited = computed(() => {
    // Takes the full array from the store and returns only the first 5 orders
    return salesStore.recentOrders.slice(0, 5);
});

const periodLabel = computed(() => {
  switch (selectedPeriod.value) {
    case "today": return "Today";
    case "week": return "This Week";
    case "month": return "This Month";
    case "year": return "This Year";
    default: return "Custom";
  }
});

const fromDateDisplay = computed(() => {
  if (fromDate.value) {
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    };
    return fromDate.value.toLocaleDateString('en-US', formatOptions);
  }
  return "Select from date";
});

const toDateDisplay = computed(() => {
  if (toDate.value) {
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    };
    return toDate.value.toLocaleDateString('en-US', formatOptions);
  }
  return "Select to date";
});

// Methods
const setPeriod = async (period: "today" | "week" | "month" | "year"): Promise<void> => {
  selectedPeriod.value = period;
  fromDate.value = null;
  toDate.value = null;
  await salesStore.fetchSalesData(period);
};

const applyDateRange = async (): Promise<void> => {
  if (fromDate.value && toDate.value) {
    // Ensure fromDate is before toDate
    const [start, end] = [fromDate.value, toDate.value].sort((a, b) => a.getTime() - b.getTime());
    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];
    await salesStore.fetchSalesDataByRange(startDate, endDate);
    selectedPeriod.value = "today"; // Reset to indicate custom
    fromDateMenu.value = false;
    toDateMenu.value = false;
  }
};

const onFromDateChange = (date: Date | null) => {
  fromDate.value = date;
};

const onToDateChange = (date: Date | null) => {
  toDate.value = date;
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
  await salesStore.fetchSalesData("today");
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
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-filter"
                  @click="showFilters = !showFilters"
                >
                  Filters
                </v-btn>
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
                  <v-btn-toggle
                    v-model="selectedPeriod"
                    mandatory
                    color="primary"
                    variant="outlined"
                    divided
                  >
                    <v-btn value="today" @click="setPeriod('today')">Today</v-btn>
                    <v-btn value="week" @click="setPeriod('week')">This Week</v-btn>
                    <v-btn value="month" @click="setPeriod('month')">This Month</v-btn>
                    <v-btn value="year" @click="setPeriod('year')">This Year</v-btn>
                  </v-btn-toggle>

                  <v-spacer></v-spacer>

                  <div class="d-flex align-center gap-2">
                    <!-- From Date Picker -->
                    <v-menu
                      v-model="fromDateMenu"
                      :close-on-content-click="false"
                      transition="scale-transition"
                      offset-y
                      min-width="auto"
                    >
                      <template v-slot:activator="{ props }">
                        <v-text-field
                          v-bind="props"
                          :value="fromDateDisplay"
                          label="From Date"
                          variant="outlined"
                          density="compact"
                          hide-details
                          readonly
                          prepend-inner-icon="mdi-calendar"
                          style="width: 200px; min-width: 200px;"
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="fromDate"
                        color="primary"
                        show-adjacent-months
                        :max="toDate ? toDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]"
                        @update:model-value="onFromDateChange"
                      >
                        <template v-slot:actions>
                          <v-btn
                            variant="text"
                            @click="fromDateMenu = false"
                          >
                            Cancel
                          </v-btn>
                          <v-btn
                            color="primary"
                            variant="flat"
                            @click="fromDateMenu = false"
                            :disabled="!fromDate"
                          >
                            OK
                          </v-btn>
                        </template>
                      </v-date-picker>
                    </v-menu>

                    <!-- To Date Picker -->
                    <v-menu
                      v-model="toDateMenu"
                      :close-on-content-click="false"
                      transition="scale-transition"
                      offset-y
                      min-width="auto"
                    >
                      <template v-slot:activator="{ props }">
                        <v-text-field
                          v-bind="props"
                          :value="toDateDisplay"
                          label="To Date"
                          variant="outlined"
                          density="compact"
                          hide-details
                          readonly
                          prepend-inner-icon="mdi-calendar"
                          style="width: 200px; min-width: 200px;"
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        v-model="toDate"
                        color="primary"
                        show-adjacent-months
                        :min="fromDate ? fromDate.toISOString().split('T')[0] : undefined"
                        :max="new Date().toISOString().split('T')[0]"
                        @update:model-value="onToDateChange"
                      >
                        <template v-slot:actions>
                          <v-btn
                            variant="text"
                            @click="toDateMenu = false"
                          >
                            Cancel
                          </v-btn>
                          <v-btn
                            color="primary"
                            variant="flat"
                            @click="toDateMenu = false"
                            :disabled="!toDate"
                          >
                            OK
                          </v-btn>
                        </template>
                      </v-date-picker>
                    </v-menu>

                    <!-- Apply Button -->
                    <v-btn
                      color="primary"
                      variant="flat"
                      @click="applyDateRange"
                      :disabled="!fromDate || !toDate"
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
        <SalesSummaryCards :sales-summary="salesSummary" />

        <!-- Charts Row -->
        <SalesChartsRow
          :sales-trend="salesTrend"
          :category-sales="categorySales"
          :period-label="periodLabel"
          :from-date="fromDate"
          :to-date="toDate"
        />

        <!-- Top Selling Items and Recent Orders -->
        <v-row class="mb-4">
          <TopSellingItems
            :top-selling-items="topSellingItems"
            :period-label="periodLabel"
          />
          <RecentOrders :recent-orders-limited="recentOrdersLimited" />
        </v-row>

        <!-- Category Sales Details -->
        <CategorySalesDetails :category-sales="categorySales" />
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
