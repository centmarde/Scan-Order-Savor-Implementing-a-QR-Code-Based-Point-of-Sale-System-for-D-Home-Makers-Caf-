<script setup lang="ts">
interface StatisticCard {
  label: string;
  count: number;
  color: string;
  icon: string;
  textColor: string;
}

interface Props {
  confirmedCount: number;
  preparingCount: number;
  completedCount: number;
  cancelledCount: number;
}

const props = defineProps<Props>();

const statistics: StatisticCard[] = [
  {
    label: 'Confirmed',
    count: props.confirmedCount,
    color: 'blue-lighten-5',
    icon: 'mdi-check-circle',
    textColor: 'text-blue'
  },
  {
    label: 'Preparing',
    count: props.preparingCount,
    color: 'orange-lighten-5',
    icon: 'mdi-chef-hat',
    textColor: 'text-orange'
  },
  {
    label: 'Completed',
    count: props.completedCount,
    color: 'green-lighten-5',
    icon: 'mdi-check-all',
    textColor: 'text-green'
  },
  {
    label: 'Cancelled',
    count: props.cancelledCount,
    color: 'red-lighten-5',
    icon: 'mdi-close-circle',
    textColor: 'text-red'
  }
];
</script>

<template>
  <v-row class="mb-4">
    <v-col 
      v-for="stat in statistics" 
      :key="stat.label"
      cols="12" 
      sm="6" 
      md="3"
    >
      <v-card :color="stat.color">
        <v-card-text>
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-caption text-grey-darken-1">
                {{ stat.label }}
              </div>
              <div class="text-h5 font-weight-bold" :class="stat.textColor">
                {{ stat.count }}
              </div>
            </div>
            <v-icon :color="stat.textColor.replace('text-', '')" size="36">
              {{ stat.icon }}
            </v-icon>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>