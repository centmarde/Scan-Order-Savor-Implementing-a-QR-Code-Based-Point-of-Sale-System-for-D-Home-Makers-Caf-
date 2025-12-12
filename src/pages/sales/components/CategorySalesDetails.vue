<template>
  <v-row>
    <v-col cols="12">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Sales by Category - Detailed View</span>
          <v-chip
            v-if="showDateRangeChip"
            color="primary"
            size="small"
            variant="outlined"
          >
            {{ getDateRangeLabel }}
          </v-chip>
        </v-card-title>
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
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatCurrency } from "@/utils/helpers";

interface CategorySale {
  name: string;
  revenue: number;
  itemsSold: number;
  avgPrice: number;
  percentage: number;
}

interface Props {
  categorySales: CategorySale[];
  dateRange?: [Date, Date] | null;
  periodLabel?: string;
}

const props = defineProps<Props>();

const showDateRangeChip = computed(() => {
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
  return props.periodLabel || 'All time';
});
</script>
