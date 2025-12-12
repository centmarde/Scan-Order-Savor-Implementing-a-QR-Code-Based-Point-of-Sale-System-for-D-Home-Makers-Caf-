<template>
  <v-row class="mb-4">
    <!-- Date Range Indicator -->
    <v-col cols="12" v-if="showDateRangeIndicator">
      <v-alert
        type="info"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        <template v-slot:prepend>
          <v-icon>mdi-calendar-range</v-icon>
        </template>
        <span class="text-body-2">
          Showing data for: <strong>{{ getDateRangeLabel }}</strong>
        </span>
      </v-alert>
    </v-col>

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

import { computed } from "vue";

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
  dateRange?: [Date, Date] | null;
  periodLabel?: string;
}

const props = defineProps<Props>();

const showDateRangeIndicator = computed(() => {
  return props.dateRange && props.dateRange.length >= 2;
});

const getDateRangeLabel = computed(() => {
  if (props.dateRange && props.dateRange.length >= 2) {
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    const fromDateStr = props.dateRange[0].toLocaleDateString('en-US', formatOptions);
    const toDateStr = props.dateRange[1].toLocaleDateString('en-US', formatOptions);
    return `${fromDateStr} to ${toDateStr}`;
  }
  return props.periodLabel || 'Custom';
});

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
