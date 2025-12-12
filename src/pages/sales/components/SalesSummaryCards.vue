<template>
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
</template>

<script setup lang="ts">
import { formatCurrency } from "@/utils/helpers";

interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

interface Props {
  salesSummary: SalesSummary;
}

defineProps<Props>();

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
</script>
