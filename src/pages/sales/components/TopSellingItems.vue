<template>
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
</template>

<script setup lang="ts">
import { formatCurrency } from "@/utils/helpers";

interface TopSellingItem {
  id: number;
  name: string;
  quantitySold: number;
  revenue: number;
}

interface Props {
  topSellingItems: TopSellingItem[];
  periodLabel: string;
  dateRange?: [Date, Date] | null;
}

defineProps<Props>();
</script>
