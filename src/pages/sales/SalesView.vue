<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useSalesDataStore } from "@/stores/salesData";
import { formatCurrency, formatDate } from "@/utils/helpers";
import InnerLayoutWrapper from "@/layouts/InnerLayoutWrapper.vue";

const router = useRouter();
const salesStore = useSalesDataStore();

// State
const selectedPeriod = ref<"today" | "week" | "month" | "year">("today");
const dateRange = ref<[string, string] | null>(null);
const showFilters = ref(false);
const selectedCategory = ref<string>("all");

// Computed
const loading = computed(() => salesStore.loading);
const salesSummary = computed(() => salesStore.salesSummary);
const topSellingItems = computed(() => salesStore.topSellingItems);
const recentOrders = computed(() => salesStore.recentOrders);
const salesTrend = computed(() => salesStore.salesTrend);
const categorySales = computed(() => salesStore.categorySales);

const periodLabel = computed(() => {
  switch (selectedPeriod.value) {
    case "today": return "Today";
    case "week": return "This Week";
    case "month": return "This Month";
    case "year": return "This Year";
    default: return "Custom";
  }
});

// Methods
const setPeriod = async (period: "today" | "week" | "month" | "year"): Promise<void> => {
  selectedPeriod.value = period;
  dateRange.value = null;
  await salesStore.fetchSalesData(period);
};

const applyDateRange = async (): Promise<void> => {
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    await salesStore.fetchSalesDataByRange(dateRange.value[0], dateRange.value[1]);
    selectedPeriod.value = "today"; // Reset to indicate custom
  }
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

const getGrowthColor = (growth: number): string => {
  if (growth > 0) return "success";
  if (growth < 0) return "error";
  return "grey";
};

const getGrowthIcon = (growth: number): string => {
  if (growth > 0) return "mdi-trending-up";
  if (growth < 0) return "mdi-trending-down";
  return "mdi-minus";
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
                    <v-text-field
                      v-model="dateRange"
                      type="date"
                      label="Custom Range"
                      variant="outlined"
                      density="compact"
                      hide-details
                      style="max-width: 300px"
                    ></v-text-field>
                    <v-btn
                      color="primary"
                      variant="flat"
                      @click="applyDateRange"
                      :disabled="!dateRange"
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
        <v-row class="mb-4">
          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-2">
                  <v-avatar color="green-lighten-4" size="48">
                    <v-icon color="green" size="28">mdi-currency-php</v-icon>
                  </v-avatar>
                  <v-chip
                    :color="getGrowthColor(salesSummary.revenueGrowth)"
                    size="small"
                    variant="flat"
                  >
                    <v-icon start size="14">{{ getGrowthIcon(salesSummary.revenueGrowth) }}</v-icon>
                    {{ Math.abs(salesSummary.revenueGrowth).toFixed(1) }}%
                  </v-chip>
                </div>
                <div class="text-h4 font-weight-bold">
                  {{ formatCurrency(salesSummary.totalRevenue) }}
                </div>
                <div class="text-caption text-grey">Total Revenue</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-2">
                  <v-avatar color="blue-lighten-4" size="48">
                    <v-icon color="blue" size="28">mdi-receipt</v-icon>
                  </v-avatar>
                  <v-chip
                    :color="getGrowthColor(salesSummary.ordersGrowth)"
                    size="small"
                    variant="flat"
                  >
                    <v-icon start size="14">{{ getGrowthIcon(salesSummary.ordersGrowth) }}</v-icon>
                    {{ Math.abs(salesSummary.ordersGrowth).toFixed(1) }}%
                  </v-chip>
                </div>
                <div class="text-h4 font-weight-bold">
                  {{ salesSummary.totalOrders }}
                </div>
                <div class="text-caption text-grey">Total Orders</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-2">
                  <v-avatar color="orange-lighten-4" size="48">
                    <v-icon color="orange" size="28">mdi-chart-line</v-icon>
                  </v-avatar>
                </div>
                <div class="text-h4 font-weight-bold">
                  {{ formatCurrency(salesSummary.averageOrderValue) }}
                </div>
                <div class="text-caption text-grey">Average Order Value</div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card>
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-2">
                  <v-avatar color="purple-lighten-4" size="48">
                    <v-icon color="purple" size="28">mdi-silverware-fork-knife</v-icon>
                  </v-avatar>
                </div>
                <div class="text-h4 font-weight-bold">
                  {{ salesSummary.totalItemsSold }}
                </div>
                <div class="text-caption text-grey">Items Sold</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Charts Row -->
        <v-row class="mb-4">
          <!-- Sales Trend Chart -->
          <v-col cols="12" md="8">
            <v-card>
              <v-card-title>Sales Trend - {{ periodLabel }}</v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <div class="chart-container" style="height: 300px">
                  <canvas ref="salesChart"></canvas>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Category Breakdown -->
          <v-col cols="12" md="4">
            <v-card>
              <v-card-title>Sales by Category</v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <div class="chart-container" style="height: 300px">
                  <canvas ref="categoryChart"></canvas>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Top Selling Items -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title class="d-flex align-center justify-space-between">
                <span>Top Selling Items</span>
                <v-chip color="primary" size="small">{{ periodLabel }}</v-chip>
              </v-card-title>
              <v-divider></v-divider>

              <v-list>
                <v-list-item
                  v-for="(item, index) in topSellingItems"
                  :key="item.id"
                >
                  <template v-slot:prepend>
                    <v-avatar size="40" class="mr-3">
                      <span class="text-h6 font-weight-bold">{{ index + 1 }}</span>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="font-weight-medium">
                    {{ item.name }}
                  </v-list-item-title>

                  <v-list-item-subtitle>
                    {{ item.quantitySold }} sold • {{ formatCurrency(item.revenue) }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-bold">
                        {{ formatCurrency(item.revenue) }}
                      </div>
                      <v-progress-linear
                        :model-value="(item.revenue / topSellingItems[0]?.revenue) * 100"
                        color="primary"
                        height="4"
                        class="mt-1"
                      ></v-progress-linear>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>

          <!-- Recent Orders -->
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>Recent Orders</v-card-title>
              <v-divider></v-divider>

              <v-list>
                <v-list-item
                  v-for="order in recentOrders"
                  :key="order.id"
                >
                  <template v-slot:prepend>
                    <v-avatar color="primary-lighten-4" size="40">
                      <span class="text-primary">#{{ order.id }}</span>
                    </v-avatar>
                  </template>

                  <v-list-item-title>
                    Table {{ order.table_id }}
                  </v-list-item-title>

                  <v-list-item-subtitle>
                    {{ formatDate(order.created_at) }} • {{ order.itemCount }} items
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="text-right">
                      <div class="text-body-2 font-weight-bold">
                        {{ formatCurrency(order.total_amount) }}
                      </div>
                      <v-chip
                        :color="order.status === 'completed' ? 'success' : 'orange'"
                        size="x-small"
                        class="mt-1"
                      >
                        {{ order.status }}
                      </v-chip>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>

        <!-- Category Sales Details -->
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Sales by Category - Detailed View</v-card-title>
              <v-divider></v-divider>

              <v-table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th class="text-right">Items Sold</th>
                    <th class="text-right">Revenue</th>
                    <th class="text-right">Avg Price</th>
                    <th class="text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="category in categorySales" :key="category.name">
                    <td class="font-weight-medium">{{ category.name }}</td>
                    <td class="text-right">{{ category.itemsSold }}</td>
                    <td class="text-right">{{ formatCurrency(category.revenue) }}</td>
                    <td class="text-right">{{ formatCurrency(category.avgPrice) }}</td>
                    <td class="text-right">
                      <v-chip color="primary" size="small" variant="flat">
                        {{ category.percentage.toFixed(1) }}%
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </InnerLayoutWrapper>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}

.chart-container {
  position: relative;
  width: 100%;
}
</style>