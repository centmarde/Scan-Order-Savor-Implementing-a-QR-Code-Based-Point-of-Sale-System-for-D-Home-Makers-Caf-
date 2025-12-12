<template>
  <v-col cols="12" md="6">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Recent Orders</span>
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

      <v-list>
        <v-list-item
          v-for="order in recentOrdersLimited"
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
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatCurrency, formatDate } from "@/utils/helpers";

interface RecentOrder {
  id: number;
  table_id: number;
  created_at: string;
  total_amount: number;
  status: string;
  itemCount: number;
}

interface Props {
  recentOrdersLimited: RecentOrder[];
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
      day: 'numeric'
    };
    const fromDateStr = props.dateRange[0].toLocaleDateString('en-US', formatOptions);
    const toDateStr = props.dateRange[1].toLocaleDateString('en-US', formatOptions);
    return `${fromDateStr} - ${toDateStr}`;
  }
  return props.periodLabel || 'All';
});
</script>
