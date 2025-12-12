<template>
  <v-row class="mb-4">
    <!-- Sales Trend Chart -->
    <v-col cols="12" md="8">
      <v-card>
        <v-card-title>Sales Trend - {{ getChartTitle }}</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <div class="chart-container" style="height: 300px">
            <canvas ref="salesChart"></canvas>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Category Breakdown -->
    <v-col cols="12" md="4">
      <v-card>
        <v-card-title>Sales by Category</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <div class="chart-container" style="height: 300px">
            <canvas ref="categoryChart"></canvas>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { formatCurrency } from "@/utils/helpers";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  TimeScale
} from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  TimeScale
);

interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface CategorySale {
  name: string;
  revenue: number;
  itemsSold: number;
  avgPrice: number;
  percentage: number;
}

interface Props {
  salesTrend: SalesTrendPoint[];
  categorySales: CategorySale[];
  periodLabel: string;
  fromDate?: Date | null;
  toDate?: Date | null;
}

const props = defineProps<Props>();

// Computed
const getChartTitle = computed(() => {
  if (props.fromDate && props.toDate) {
    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    const fromDateStr = props.fromDate.toLocaleDateString('en-US', formatOptions);
    const toDateStr = props.toDate.toLocaleDateString('en-US', formatOptions);
    return `${fromDateStr} to ${toDateStr}`;
  }
  return props.periodLabel;
});

// Chart refs and instances
const salesChart = ref<HTMLCanvasElement | null>(null);
const categoryChart = ref<HTMLCanvasElement | null>(null);
let salesChartInstance: Chart | null = null;
let categoryChartInstance: Chart | null = null;
let isCreatingSalesChart = false;
let isCreatingCategoryChart = false;

// Chart functions
const createSalesChart = async (): Promise<void> => {
  if (isCreatingSalesChart) return;
  isCreatingSalesChart = true;

  try {
    await nextTick();

    if (!salesChart.value) {
      console.log('Sales chart canvas not found');
      return;
    }

    if (salesChartInstance) {
      salesChartInstance.destroy();
      salesChartInstance = null;
    }

    const ctx = salesChart.value.getContext('2d');
    if (!ctx) {
      console.log('Could not get canvas context for sales chart');
      return;
    }

    const chartData = props.salesTrend.length > 0 ? props.salesTrend : [
      { date: new Date().toISOString(), revenue: 1500, orders: 8 },
      { date: new Date(Date.now() - 86400000).toISOString(), revenue: 1200, orders: 6 },
      { date: new Date(Date.now() - 2*86400000).toISOString(), revenue: 1800, orders: 10 },
      { date: new Date(Date.now() - 3*86400000).toISOString(), revenue: 1000, orders: 5 },
      { date: new Date(Date.now() - 4*86400000).toISOString(), revenue: 2200, orders: 12 }
    ];

    salesChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.map(point => new Date(point.date).toLocaleDateString()),
        datasets: [{
          label: 'Revenue',
          data: chartData.map(point => point.revenue),
          borderColor: 'rgb(25, 118, 210)',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        }, {
          label: 'Orders',
          data: chartData.map(point => point.orders),
          borderColor: 'rgb(76, 175, 80)',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Revenue (₱)'
            },
            ticks: {
              callback: function(value) {
                return '₱' + Number(value).toLocaleString();
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Orders'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.datasetIndex === 0) {
                  label += formatCurrency(Number(context.parsed.y));
                } else {
                  label += context.parsed.y + ' orders';
                }
                return label;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating sales chart:', error);
  } finally {
    isCreatingSalesChart = false;
  }
};

const createCategoryChart = async (): Promise<void> => {
  if (isCreatingCategoryChart) return;
  isCreatingCategoryChart = true;

  try {
    await nextTick();

    if (!categoryChart.value) {
      console.log('Category chart canvas not found');
      return;
    }

    if (categoryChartInstance) {
      categoryChartInstance.destroy();
      categoryChartInstance = null;
    }

    const ctx = categoryChart.value.getContext('2d');
    if (!ctx) {
      console.log('Could not get canvas context for category chart');
      return;
    }

    const chartData = props.categorySales.length > 0 ? props.categorySales : [
      { name: 'Coffee', revenue: 1200, itemsSold: 45, avgPrice: 26.67, percentage: 40 },
      { name: 'Pastries', revenue: 800, itemsSold: 32, avgPrice: 25, percentage: 27 },
      { name: 'Beverages', revenue: 600, itemsSold: 24, avgPrice: 25, percentage: 20 },
      { name: 'Snacks', revenue: 400, itemsSold: 16, avgPrice: 25, percentage: 13 }
    ];

    const colors = [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 205, 86)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)',
      'rgb(199, 199, 199)',
      'rgb(83, 102, 147)'
    ];

    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartData.map(cat => cat.name),
        datasets: [{
          data: chartData.map(cat => cat.revenue),
          backgroundColor: colors.slice(0, chartData.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = formatCurrency(Number(context.parsed));
                const percentage = chartData[context.dataIndex].percentage;
                return `${label}: ${value} (${percentage.toFixed(1)}%)`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating category chart:', error);
  } finally {
    isCreatingCategoryChart = false;
  }
};

// Lifecycle
onMounted(async () => {
  await createSalesChart();
  await createCategoryChart();
});

// Watch for data changes and update charts
watch(() => [props.salesTrend, props.categorySales], async () => {
  if (!isCreatingSalesChart && !isCreatingCategoryChart) {
    setTimeout(async () => {
      await createSalesChart();
      await createCategoryChart();
    }, 100);
  }
}, { deep: true });

// Cleanup on unmount
onUnmounted(() => {
  if (salesChartInstance) {
    salesChartInstance.destroy();
  }
  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }
});
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
}
</style>
