<template>
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
</template>

<script setup lang="ts">
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
}

defineProps<Props>();
</script>
