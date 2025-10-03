<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
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

// Data for best sellers and analytics
const bestSellers = ref<MenuItem[]>([]);
const salesData = ref<MenuItem[]>([]);
const loading = ref(false);
const selectedPeriod = ref("week"); // week, month, day

// Computed properties for analytics
const totalSales = computed(() => {
  return salesData.value.reduce((total, item) => total + item.sales, 0);
});

const filteredSalesData = computed(() => {
  const now = new Date();
  let startDate = new Date();

  if (selectedPeriod.value === "day") {
    startDate.setHours(0, 0, 0, 0);
  } else if (selectedPeriod.value === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (selectedPeriod.value === "month") {
    startDate.setMonth(now.getMonth() - 1);
  }

  return salesData.value.filter((item) => {
    const itemDate = new Date(item.created_at);
    return itemDate >= startDate;
  });
});

const periodTotalSales = computed(() => {
  return filteredSalesData.value.reduce((total, item) => total + item.sales, 0);
});

// Methods
const fetchBestSellers = async () => {
  try {
    const { data, error } = await supabase
      .from("menu")
      .select("*")
      .order("sales", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Error fetching best sellers:", error);
      return;
    }

    bestSellers.value = data || [];
  } catch (error) {
    console.error("Error in fetchBestSellers:", error);
  }
};

const fetchSalesData = async () => {
  try {
    const { data, error } = await supabase
      .from("menu")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales data:", error);
      return;
    }

    salesData.value = data || [];
  } catch (error) {
    console.error("Error in fetchSalesData:", error);
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
  await Promise.all([fetchBestSellers(), fetchSalesData()]);
  loading.value = false;
};

onMounted(() => {
  refreshData();
});
</script>

<template>
  <div>
    <!-- Sales Analytics Section -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card elevation="4" class="pa-4">
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-h5">Sales Analytics</span>
            <div class="d-flex align-center">
              <v-btn-toggle
                v-model="selectedPeriod"
                mandatory
                density="compact"
                variant="outlined"
              >
                <v-btn value="day" size="small">Today</v-btn>
                <v-btn value="week" size="small">This Week</v-btn>
                <v-btn value="month" size="small">This Month</v-btn>
              </v-btn-toggle>
              <v-btn
                icon="mdi-refresh"
                variant="text"
                size="small"
                @click="refreshData"
                :loading="loading"
                class="ml-2"
              />
            </div>
          </v-card-title>

          <v-row class="mt-2">
            <v-col cols="12" md="4">
              <v-card variant="tonal" color="primary" class="pa-4">
                <div class="d-flex align-center">
                  <v-icon size="40" class="mr-3">mdi-chart-line</v-icon>
                  <div>
                    <div class="text-h4 font-weight-bold">
                      {{ periodTotalSales }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
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
            <v-col cols="12" md="4">
              <v-card variant="tonal" color="success" class="pa-4">
                <div class="d-flex align-center">
                  <v-icon size="40" class="mr-3">mdi-trending-up</v-icon>
                  <div>
                    <div class="text-h4 font-weight-bold">{{ totalSales }}</div>
                    <div class="text-caption text-medium-emphasis">
                      Total Sales (All Time)
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card variant="tonal" color="info" class="pa-4">
                <div class="d-flex align-center">
                  <v-icon size="40" class="mr-3">mdi-food</v-icon>
                  <div>
                    <div class="text-h4 font-weight-bold">
                      {{ bestSellers.length }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
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
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card elevation="4" class="pa-4">
          <v-card-title class="text-h5 mb-4">
            <v-icon class="mr-2">mdi-star</v-icon>
            Best Sellers
          </v-card-title>

          <v-row v-if="bestSellers.length > 0">
            <v-col
              v-for="item in bestSellers"
              :key="item.id"
              cols="12"
              sm="6"
              md="4"
              lg="2"
            >
              <v-card elevation="2" class="h-100">
                <v-img
                  :src="getImageUrl(item.image)"
                  height="120"
                  cover
                  class="text-white"
                >
                  <template #placeholder>
                    <div class="d-flex align-center justify-center fill-height">
                      <v-progress-circular
                        color="grey-lighten-4"
                        indeterminate
                      />
                    </div>
                  </template>
                  <div class="d-flex justify-end pa-2">
                    <v-chip
                      color="success"
                      size="small"
                      prepend-icon="mdi-fire"
                    >
                      {{ item.sales }}
                    </v-chip>
                  </div>
                </v-img>

                <v-card-text class="pa-3">
                  <div class="text-subtitle-2 font-weight-bold mb-1">
                    {{ item.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis mb-2">
                    {{ item.category }}
                  </div>
                  <div class="text-h6 font-weight-bold text-primary">
                    {{ formatCurrency(item.price) }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div v-else-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="64" />
            <div class="text-body-1 mt-4">Loading best sellers...</div>
          </div>

          <div v-else class="text-center py-8">
            <v-icon size="64" color="grey-lighten-2">mdi-food-off</v-icon>
            <div class="text-body-1 text-medium-emphasis mt-4">
              No menu items found
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
/* Add any component-specific styles here */
</style>
