<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useMenuDataStore } from "@/stores/menuData";
import { useOrderItems } from "@/composables/useOrderItems";
import BestSellers from "@/components/admin/BestSellers.vue";

// Store
const menuDataStore = useMenuDataStore();

// Composables
const {
  orderItems,
  loading: orderItemsLoading,
  fetchOrderItems,
  getPeriodTotalSales,
} = useOrderItems();

// Data for analytics
const loading = ref(false);
const selectedPeriod = ref("week"); // week, month, day

// Computed properties for analytics
const totalSales = computed(() => {
  const total = menuDataStore.menuItems.reduce(
    (total, item) => total + (item.sales || 0),
    0
  );
  console.log(
    "Total sales calculation:",
    menuDataStore.menuItems.map((item) => ({
      name: item.name,
      sales: item.sales,
    })),
    "Total:",
    total
  );
  return total;
});

const totalMenuItems = computed(() => {
  return menuDataStore.menuItems.length;
});

const periodTotalSales = computed(() => {
  return getPeriodTotalSales(selectedPeriod.value);
});

// Methods
const refreshData = async () => {
  loading.value = true;
  await Promise.all([
    menuDataStore.fetchMenuItems(true), // Force refresh
    fetchOrderItems(),
  ]);
  loading.value = false;
};

onMounted(async () => {
  // Initialize menu data if not already loaded
  if (menuDataStore.menuItems.length === 0) {
    await menuDataStore.fetchMenuItems();
  }
  await refreshData();
});
</script>

<template>
  <div>
    <!-- Sales Analytics Section -->
    <v-row class="mt-4 mt-md-6">
      <v-col cols="12">
        <v-card elevation="4" class="pa-3 pa-md-4">
          <v-card-title
            :class="
              $vuetify.display.xs
                ? 'd-flex flex-column align-start gap-3'
                : 'd-flex align-center justify-space-between'
            "
          >
            <span :class="$vuetify.display.xs ? 'text-h6' : 'text-h5'"
              >Sales Analytics</span
            >
            <div class="d-flex align-center flex-wrap">
              <v-btn-toggle
                v-model="selectedPeriod"
                mandatory
                :density="$vuetify.display.xs ? 'comfortable' : 'compact'"
                variant="outlined"
                :class="$vuetify.display.xs ? 'mb-2' : ''"
              >
                <v-btn
                  value="day"
                  :size="$vuetify.display.xs ? 'x-small' : 'small'"
                >
                  {{ $vuetify.display.xs ? "Day" : "Today" }}
                </v-btn>
                <v-btn
                  value="week"
                  :size="$vuetify.display.xs ? 'x-small' : 'small'"
                >
                  {{ $vuetify.display.xs ? "Week" : "This Week" }}
                </v-btn>
                <v-btn
                  value="month"
                  :size="$vuetify.display.xs ? 'x-small' : 'small'"
                >
                  {{ $vuetify.display.xs ? "Month" : "This Month" }}
                </v-btn>
              </v-btn-toggle>
              <v-btn
                icon="mdi-refresh"
                variant="text"
                :size="$vuetify.display.xs ? 'small' : 'small'"
                @click="refreshData"
                :loading="loading"
                :class="$vuetify.display.xs ? 'ml-1' : 'ml-2'"
              />
            </div>
          </v-card-title>

          <v-row class="mt-2">
            <v-col cols="12" sm="6" md="4">
              <v-card
                variant="tonal"
                color="primary"
                :class="$vuetify.display.xs ? 'pa-3' : 'pa-4'"
              >
                <div class="d-flex align-center">
                  <v-icon
                    :size="$vuetify.display.xs ? '32' : '40'"
                    :class="$vuetify.display.xs ? 'mr-2' : 'mr-3'"
                  >
                    mdi-chart-line
                  </v-icon>
                  <div>
                    <div
                      :class="
                        $vuetify.display.xs
                          ? 'text-h5 font-weight-bold'
                          : 'text-h4 font-weight-bold'
                      "
                    >
                      {{ periodTotalSales }}
                    </div>
                    <div
                      :class="
                        $vuetify.display.xs
                          ? 'text-caption text-medium-emphasis text-wrap'
                          : 'text-caption text-medium-emphasis'
                      "
                    >
                      Total Sales ({{
                        selectedPeriod === "day"
                          ? "Today"
                          : selectedPeriod === "week"
                          ? "This Week"
                          : "This Month"
                      }})
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-card
                variant="tonal"
                color="success"
                :class="$vuetify.display.xs ? 'pa-3' : 'pa-4'"
              >
                <div class="d-flex align-center">
                  <v-icon
                    :size="$vuetify.display.xs ? '32' : '40'"
                    :class="$vuetify.display.xs ? 'mr-2' : 'mr-3'"
                  >
                    mdi-trending-up
                  </v-icon>
                  <div>
                    <div
                      :class="
                        $vuetify.display.xs
                          ? 'text-h5 font-weight-bold'
                          : 'text-h4 font-weight-bold'
                      "
                    >
                      {{ totalSales }}
                    </div>
                    <div
                      :class="
                        $vuetify.display.xs
                          ? 'text-caption text-medium-emphasis text-wrap'
                          : 'text-caption text-medium-emphasis'
                      "
                    >
                      Total Sales (All Time)
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <v-card
                variant="tonal"
                color="info"
                :class="$vuetify.display.xs ? 'pa-3' : 'pa-4'"
              >
                <div class="d-flex align-center">
                  <v-icon
                    :size="$vuetify.display.xs ? '32' : '40'"
                    :class="$vuetify.display.xs ? 'mr-2' : 'mr-3'"
                  >
                    mdi-food
                  </v-icon>
                  <div>
                    <div
                      :class="
                        $vuetify.display.xs
                          ? 'text-h5 font-weight-bold'
                          : 'text-h4 font-weight-bold'
                      "
                    >
                      {{ totalMenuItems }}
                    </div>
                    <div
                      :class="
                        $vuetify.display.xs
                          ? 'text-caption text-medium-emphasis text-wrap'
                          : 'text-caption text-medium-emphasis'
                      "
                    >
                      Menu Items
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Best Sellers Section -->
    <BestSellers
      :loading="loading || menuDataStore.loading || orderItemsLoading"
      :limit="3"
    />
  </div>
</template>

<style scoped>
/* Responsive Typography */
@media (max-width: 600px) {
  .dashboard-container {
    padding: 8px !important;
  }

  .analytics-card .v-card-title {
    padding-bottom: 12px !important;
  }

  .stat-card {
    margin-bottom: 12px;
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  .stat-card {
    margin-bottom: 16px;
  }
}

/* Ensure cards have consistent heights */
.stat-card {
  height: 100%;
}

/* Text wrapping for small screens */
.text-wrap {
  word-wrap: break-word;
  hyphens: auto;
}

/* Button group responsiveness */
@media (max-width: 600px) {
  .v-btn-toggle {
    width: 100%;
  }

  .v-btn-toggle .v-btn {
    flex: 1;
    min-width: 0;
  }
}
</style>
