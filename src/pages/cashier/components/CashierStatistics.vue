<script setup lang="ts">
import { formatCurrency } from "@/utils/helpers";

interface Props {
  pendingOrdersCount: number;
  todayOrdersCount: number;
  todayRevenue: number;
  uniqueTablesCount: number;
}

defineProps<Props>();
</script>

<template>
  <v-row class="mb-4">
    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text>
          <div class="d-flex align-center">
            <v-avatar color="orange-lighten-4" size="48" class="mr-3">
              <v-icon color="orange" size="28">mdi-clock-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ pendingOrdersCount }}
              </div>
              <div class="text-caption text-grey">Pending Orders</div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text>
          <div class="d-flex align-center">
            <v-avatar color="blue-lighten-4" size="48" class="mr-3">
              <v-icon color="blue" size="28">mdi-checkbox-marked-circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ todayOrdersCount }}
              </div>
              <div class="text-caption text-grey">Today's Orders</div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text>
          <div class="d-flex align-center">
            <v-avatar color="green-lighten-4" size="48" class="mr-3">
              <v-icon color="green" size="28">mdi-currency-php</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ formatCurrency(todayRevenue) }}
              </div>
              <div class="text-caption text-grey">Today's Revenue</div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" sm="6" md="3">
      <v-card>
        <v-card-text>
          <div class="d-flex align-center">
            <v-avatar color="purple-lighten-4" size="48" class="mr-3">
              <v-icon color="purple" size="28">mdi-table-chair</v-icon>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold">
                {{ uniqueTablesCount }}
              </div>
              <div class="text-caption text-grey">Active Tables</div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>