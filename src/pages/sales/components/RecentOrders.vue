<template>
  <v-col cols="12" md="6">
    <v-card>
      <v-card-title>Recent Orders</v-card-title>
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
}

defineProps<Props>();
</script>
