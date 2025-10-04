<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { supabase } from "@/lib/supabase";
import { useMenuDataStore } from "@/stores/menuData";

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

// Store
const menuDataStore = useMenuDataStore();

// Data for analytics
const orderItems = ref<OrderItem[]>([]);
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

const bestSellers = computed(() => {
  return menuDataStore.getBestSellerItems(3);
});

const totalMenuItems = computed(() => {
  return menuDataStore.menuItems.length;
});

const filteredOrderItems = computed(() => {
  const now = new Date();
  let startDate = new Date();

  if (selectedPeriod.value === "day") {
    startDate.setHours(0, 0, 0, 0);
  } else if (selectedPeriod.value === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (selectedPeriod.value === "month") {
    startDate.setMonth(now.getMonth() - 1);
  }

  return orderItems.value.filter((item) => {
    const itemDate = new Date(item.created_at);
    return itemDate >= startDate;
  });
});

const periodTotalSales = computed(() => {
  return filteredOrderItems.value.reduce(
    (total, item) => total + item.quantity,
    0
  );
});

// Methods
const fetchOrderItems = async () => {
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
  }
};

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return "/assets/logo1.png";
  if (imagePath.startsWith("http")) return imagePath;
  return `https://gsknjidllnenmauutahp.supabase.co/storage/v1/object/public/inventory/${imagePath}`;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

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
    <v-row class="mt-4 mt-md-6">
      <v-col cols="12">
        <v-card elevation="4" class="pa-3 pa-md-4">
          <v-card-title
            :class="$vuetify.display.xs ? 'text-h6 mb-3' : 'text-h5 mb-4'"
          >
            <v-icon :class="$vuetify.display.xs ? 'mr-1' : 'mr-2'"
              >mdi-star</v-icon
            >
            Best Sellers
          </v-card-title>

          <v-row
            v-if="bestSellers.length > 0"
            class="justify-center justify-md-start"
          >
            <v-col
              v-for="item in bestSellers"
              :key="item.id"
              cols="12"
              sm="6"
              md="4"
              xl="3"
              class="d-flex"
            >
              <v-card elevation="2" class="flex-grow-1 d-flex flex-column">
                <v-img
                  :src="getImageUrl(item.image)"
                  :height="$vuetify.display.xs ? '140' : '120'"
                  cover
                  class="text-white"
                >
                  <template #placeholder>
                    <div class="d-flex align-center justify-center fill-height">
                      <v-progress-circular
                        color="grey-lighten-4"
                        indeterminate
                        :size="$vuetify.display.xs ? '32' : '40'"
                      />
                    </div>
                  </template>
                  <div class="d-flex justify-end pa-2">
                    <v-chip
                      color="success"
                      :size="$vuetify.display.xs ? 'x-small' : 'small'"
                      prepend-icon="mdi-fire"
                    >
                      {{ item.sales }}
                    </v-chip>
                  </div>
                </v-img>

                <v-card-text
                  :class="$vuetify.display.xs ? 'pa-2' : 'pa-3'"
                  class="flex-grow-1 d-flex flex-column"
                >
                  <div
                    :class="
                      $vuetify.display.xs
                        ? 'text-body-2 font-weight-bold mb-1'
                        : 'text-subtitle-2 font-weight-bold mb-1'
                    "
                  >
                    {{ item.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis mb-2">
                    {{ item.category }}
                  </div>
                  <div class="mt-auto">
                    <div
                      :class="
                        $vuetify.display.xs
                          ? 'text-subtitle-1 font-weight-bold text-primary'
                          : 'text-h6 font-weight-bold text-primary'
                      "
                    >
                      {{ formatCurrency(item.price) }}
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div
            v-else-if="loading || menuDataStore.loading"
            :class="
              $vuetify.display.xs ? 'text-center py-6' : 'text-center py-8'
            "
          >
            <v-progress-circular
              indeterminate
              color="primary"
              :size="$vuetify.display.xs ? '48' : '64'"
            />
            <div
              :class="
                $vuetify.display.xs ? 'text-body-2 mt-3' : 'text-body-1 mt-4'
              "
            >
              Loading best sellers...
            </div>
          </div>

          <div
            v-else
            :class="
              $vuetify.display.xs ? 'text-center py-6' : 'text-center py-8'
            "
          >
            <v-icon
              :size="$vuetify.display.xs ? '48' : '64'"
              color="grey-lighten-2"
            >
              mdi-food-off
            </v-icon>
            <div
              :class="
                $vuetify.display.xs
                  ? 'text-body-2 text-medium-emphasis mt-3'
                  : 'text-body-1 text-medium-emphasis mt-4'
              "
            >
              No menu items found
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
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

  .best-sellers-grid .v-col {
    padding: 8px !important;
  }

  .best-seller-card {
    min-height: 200px;
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  .stat-card {
    margin-bottom: 16px;
  }
}

@media (min-width: 961px) {
  .best-sellers-grid {
    justify-content: flex-start;
  }
}

/* Ensure cards have consistent heights */
.stat-card {
  height: 100%;
}

.best-seller-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.best-seller-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
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

/* Loading and empty states */
.loading-state,
.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@media (max-width: 600px) {
  .loading-state,
  .empty-state {
    min-height: 150px;
  }
}
</style>
