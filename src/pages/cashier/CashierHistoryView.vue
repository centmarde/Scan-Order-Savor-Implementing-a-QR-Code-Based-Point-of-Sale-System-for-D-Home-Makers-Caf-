<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useCashierDataStore } from "@/stores/cashierData";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText,
  getStatusIcon,
  getImageUrl,
} from "@/utils/helpers";
import type { OrderHistoryItem } from "@/stores/cashierData";
import InnerLayoutWrapper from "@/layouts/InnerLayoutWrapper.vue";

const router = useRouter();
const cashierStore = useCashierDataStore();

// State
const detailsDialog = ref(false);
const confirmDialog = ref(false);
const orderToComplete = ref<OrderHistoryItem | null>(null);
const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");
const processingComplete = ref(false);

// Computed
const loading = computed(() => cashierStore.loading);
const filteredOrders = computed(() => cashierStore.filteredOrderHistory);
const selectedOrder = computed(() => cashierStore.selectedOrder);
const filters = computed({
  get: () => cashierStore.filters,
  set: (value) => cashierStore.setFilters(value),
});

const orderSummary = computed(() => {
  if (!selectedOrder.value) return { items: [], total: 0, itemCount: 0 };
  return cashierStore.getOrderSummary(selectedOrder.value);
});

// Check if order can be completed
const canCompleteOrder = (order: OrderHistoryItem): boolean => {
  return order.status === "ready" || order.status === "preparing";
};

// Table headers
const tableHeaders = [
  { title: "Order ID", key: "id", sortable: true },
  { title: "Table", key: "table_id", sortable: true },
  { title: "Status", key: "status", sortable: true },
  { title: "Items", key: "items", sortable: false },
  { title: "Total", key: "total_amount", sortable: true },
  { title: "Date/Time", key: "created_at", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
];

// Status filter options
const statusOptions = [
  { title: "All Orders", value: "all" },
  { title: "Confirmed", value: "confirmed" },
  { title: "Preparing", value: "preparing" },
  { title: "Ready", value: "ready" },
  { title: "Completed", value: "completed" },
  { title: "Cancelled", value: "cancelled" },
];

// Methods
const getStatusCount = (status: string): number => {
  return cashierStore.ordersByStatus(status).length;
};

const getOrderItems = (order: OrderHistoryItem) => {
  return cashierStore.getOrderSummary(order).items;
};

const viewOrderDetails = (order: OrderHistoryItem): void => {
  cashierStore.getOrderDetails(order.id!);
  detailsDialog.value = true;
};

const showCompleteConfirmation = (order: OrderHistoryItem): void => {
  orderToComplete.value = order;
  confirmDialog.value = true;
};

const completeOrder = async (): Promise<void> => {
  if (!orderToComplete.value?.id) return;

  try {
    processingComplete.value = true;
    
    // Update order status to completed
    await cashierStore.updateOrderStatus(orderToComplete.value.id, "completed");
    
    // Refresh the order history
    await cashierStore.fetchOrderHistory();
    
    // snackbarText.value = `Order #${orderToComplete.value.id} marked as completed`;
    // snackbarColor.value = "success";
    // snackbar.value = true;
    
    confirmDialog.value = false;
    orderToComplete.value = null;
  } catch (error) {
    console.error("Error completing order:", error);
    snackbarText.value = "Failed to complete order";
    snackbarColor.value = "error";
    snackbar.value = true;
  } finally {
    processingComplete.value = false;
  }
};

const completeOrderFromDialog = async (): Promise<void> => {
  if (!selectedOrder.value?.id) return;

  try {
    processingComplete.value = true;
    
    await cashierStore.updateOrderStatus(selectedOrder.value.id, "completed");
    await cashierStore.fetchOrderHistory();
    
    // snackbarText.value = `Order #${selectedOrder.value.id} marked as completed`;
    // snackbarColor.value = "success";
    // snackbar.value = true;
    
    detailsDialog.value = false;
  } catch (error) {
    console.error("Error completing order:", error);
    snackbarText.value = "Failed to complete order";
    snackbarColor.value = "error";
    snackbar.value = true;
  } finally {
    processingComplete.value = false;
  }
};

const resetFilters = (): void => {
  cashierStore.resetFilters();
};

const refreshHistory = async (): Promise<void> => {
  try {
    // await cashierStore.fetchOrderHistory();
    // snackbarText.value = "History refreshed";
    // snackbarColor.value = "success";
    // snackbar.value = true;
  } catch (error) {
    snackbarText.value = "Failed to refresh history";
    snackbarColor.value = "error";
    snackbar.value = true;
  }
};

const exportHistory = (): void => {
  try {
    const csv = cashierStore.exportOrderHistory();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `order-history-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    snackbarText.value = "History exported successfully";
    snackbarColor.value = "success";
    snackbar.value = true;
  } catch (error) {
    snackbarText.value = "Failed to export history";
    snackbarColor.value = "error";
    snackbar.value = true;
  }
};

const navigateBack = (): void => {
  router.push("/cashier");
};

// Lifecycle
onMounted(async () => {
  await cashierStore.fetchOrderHistory();
});

// Watch filters
watch(
  filters,
  () => {
    // Filters are reactive, no need to manually filter
  },
  { deep: true }
);
</script>

<template>
  <InnerLayoutWrapper>
    <template #content>
      <v-container fluid class="pa-4">
        <!-- Header -->
        <v-row>
          <v-col cols="12">
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="d-flex align-center">
                <v-btn icon variant="text" @click="navigateBack" class="mr-2">
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <div>
                  <h1 class="text-h4 font-weight-bold">Order History</h1>
                  <p class="text-subtitle-1 text-grey">
                    View all processed orders
                  </p>
                </div>
              </div>
              <div class="d-flex gap-2">
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-download"
                  @click="exportHistory"
                >
                  Export CSV
                </v-btn>
                <v-btn
                  color="primary"
                  prepend-icon="mdi-refresh"
                  @click="refreshHistory"
                  :loading="loading"
                >
                  Refresh
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Filters (keeping your existing filter code) -->
        <v-row class="mb-4">
          <v-col cols="12">
            <v-card>
              <v-card-text>
                <v-row>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="filters.status"
                      :items="statusOptions"
                      label="Status"
                      variant="outlined"
                      density="comfortable"
                      hide-details
                    ></v-select>
                  </v-col>

                  <v-col cols="12" sm="6" md="2">
                    <v-text-field
                      v-model="filters.tableNumber"
                      label="Table Number"
                      variant="outlined"
                      density="comfortable"
                      type="number"
                      hide-details
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="6" md="2">
                    <v-text-field
                      v-model="filters.dateFrom"
                      label="Date From"
                      variant="outlined"
                      density="comfortable"
                      type="date"
                      hide-details
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="6" md="2">
                    <v-text-field
                      v-model="filters.dateTo"
                      label="Date To"
                      variant="outlined"
                      density="comfortable"
                      type="date"
                      hide-details
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="12" md="3">
                    <v-text-field
                      v-model="filters.searchQuery"
                      label="Search orders..."
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-magnify"
                      hide-details
                      clearable
                    ></v-text-field>
                  </v-col>
                </v-row>

                <v-row class="mt-2">
                  <v-col cols="12" class="d-flex justify-end">
                    <v-btn
                      variant="text"
                      prepend-icon="mdi-filter-off"
                      @click="resetFilters"
                    >
                      Clear Filters
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Statistics Summary (keeping your existing stats) -->
        <v-row class="mb-4">
          <v-col cols="12" sm="6" md="3">
            <v-card color="blue-lighten-5">
              <v-card-text>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-caption text-grey-darken-1">Confirmed</div>
                    <div class="text-h5 font-weight-bold text-blue">
                      {{ getStatusCount("confirmed") }}
                    </div>
                  </div>
                  <v-icon color="blue" size="36">mdi-check-circle</v-icon>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card color="orange-lighten-5">
              <v-card-text>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-caption text-grey-darken-1">Preparing</div>
                    <div class="text-h5 font-weight-bold text-orange">
                      {{ getStatusCount("preparing") }}
                    </div>
                  </div>
                  <v-icon color="orange" size="36">mdi-chef-hat</v-icon>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card color="green-lighten-5">
              <v-card-text>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-caption text-grey-darken-1">Completed</div>
                    <div class="text-h5 font-weight-bold text-green">
                      {{ getStatusCount("completed") }}
                    </div>
                  </div>
                  <v-icon color="green" size="36">mdi-check-all</v-icon>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-card color="red-lighten-5">
              <v-card-text>
                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-caption text-grey-darken-1">Cancelled</div>
                    <div class="text-h5 font-weight-bold text-red">
                      {{ getStatusCount("cancelled") }}
                    </div>
                  </div>
                  <v-icon color="red" size="36">mdi-close-circle</v-icon>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Orders Table -->
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>
                <div class="d-flex align-center justify-space-between">
                  <span class="text-h6">Orders ({{ filteredOrders.length }})</span>
                </div>
              </v-card-title>

              <v-divider></v-divider>

              <!-- Empty State -->
              <div
                v-if="!loading && filteredOrders.length === 0"
                class="text-center py-12"
              >
                <v-icon size="64" color="grey-lighten-1">
                  mdi-file-document-outline
                </v-icon>
                <p class="text-h6 text-grey mt-4">No Orders Found</p>
                <p class="text-body-2 text-grey">Try adjusting your filters</p>
              </div>

              <!-- Loading State -->
              <div v-else-if="loading" class="text-center py-12">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="48"
                ></v-progress-circular>
                <p class="text-body-2 text-grey mt-4">Loading order history...</p>
              </div>

              <!-- Orders Data Table -->
              <v-data-table
                v-else
                :headers="tableHeaders"
                :items="filteredOrders"
                :items-per-page="10"
                item-value="id"
                class="elevation-0"
              >
                <!-- Order ID -->
                <template v-slot:item.id="{ item }">
                  <span class="font-weight-bold">#{{ item.id }}</span>
                </template>

                <!-- Table Number -->
                <template v-slot:item.table_id="{ item }">
                  <v-chip size="small" color="primary" variant="outlined">
                    Table {{ item.table_id }}
                  </v-chip>
                </template>

                <!-- Status -->
                <template v-slot:item.status="{ item }">
                  <v-chip
                    :color="getStatusColor(item.status)"
                    size="small"
                    variant="flat"
                  >
                    <v-icon start size="14">
                      {{ getStatusIcon(item.status) }}
                    </v-icon>
                    {{ getStatusText(item.status) }}
                  </v-chip>
                </template>

                <!-- Items -->
                <template v-slot:item.items="{ item }">
                  <div class="py-2">
                    <div
                      v-for="orderItem in getOrderItems(item)"
                      :key="orderItem.meal.id"
                      class="text-caption"
                    >
                      {{ orderItem.meal.name }} ×{{ orderItem.quantity }}
                    </div>
                  </div>
                </template>

                <!-- Total Amount -->
                <template v-slot:item.total_amount="{ item }">
                  <span class="font-weight-bold">
                    {{ formatCurrency(item.total_amount) }}
                  </span>
                </template>

                <!-- Created At -->
                <template v-slot:item.created_at="{ item }">
                  <div class="text-caption">
                    {{ formatDate(item.created_at) }}
                  </div>
                </template>

                <!-- Actions -->
                <template v-slot:item.actions="{ item }">
                  <div class="d-flex gap-1">
                    <!-- View Details Button -->
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      @click="viewOrderDetails(item)"
                    >
                      <v-icon>mdi-eye</v-icon>
                      <v-tooltip activator="parent" location="top">
                        View Details
                      </v-tooltip>
                    </v-btn>

                    <!-- Complete Order Button (only show for ready/preparing orders) -->
                    <v-btn
                      v-if="canCompleteOrder(item)"
                      icon
                      variant="text"
                      size="small"
                      color="success"
                      @click="showCompleteConfirmation(item)"
                    >
                      <v-icon>mdi-check-circle</v-icon>
                      <v-tooltip activator="parent" location="top">
                        Mark as Completed
                      </v-tooltip>
                    </v-btn>
                  </div>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>

        <!-- Order Details Dialog -->
        <v-dialog v-model="detailsDialog" max-width="700">
          <v-card v-if="selectedOrder">
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <span class="text-h5">Order #{{ selectedOrder.id }}</span>
                <v-chip
                  :color="getStatusColor(selectedOrder.status)"
                  size="small"
                  class="ml-3"
                >
                  {{ getStatusText(selectedOrder.status) }}
                </v-chip>
              </div>
              <v-btn
                icon="mdi-close"
                variant="text"
                @click="detailsDialog = false"
              ></v-btn>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text class="pa-6">
              <!-- Order Information -->
              <v-row class="mb-4">
                <v-col cols="6">
                  <div class="text-caption text-grey mb-1">Table Number</div>
                  <div class="text-h6 font-weight-bold">
                    Table {{ selectedOrder.table_id }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-grey mb-1">Order Time</div>
                  <div class="font-weight-medium">
                    {{ formatDate(selectedOrder.created_at) }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-grey mb-1">Total Items</div>
                  <div class="font-weight-medium">
                    {{ orderSummary.itemCount }} items
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-caption text-grey mb-1">Total Amount</div>
                  <div class="text-h6 font-weight-bold text-primary">
                    {{ formatCurrency(selectedOrder.total_amount) }}
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>

              <!-- Order Items -->
              <div>
                <h3 class="text-subtitle-1 font-weight-bold mb-3">Order Items</h3>

                <v-list lines="two">
                  <v-list-item
                    v-for="item in orderSummary.items"
                    :key="item.meal.id"
                    class="px-0"
                  >
                    <template v-slot:prepend>
                      <v-avatar size="56" rounded class="mr-3">
                        <v-img :src="getImageUrl(item.meal.image)"></v-img>
                      </v-avatar>
                    </template>

                    <v-list-item-title class="font-weight-medium">
                      {{ item.meal.name }}
                    </v-list-item-title>

                    <v-list-item-subtitle>
                      {{ formatCurrency(item.meal.price) }} × {{ item.quantity }}
                    </v-list-item-subtitle>

                    <template v-slot:append>
                      <div class="text-h6 font-weight-bold">
                        {{ formatCurrency(item.subtotal) }}
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </div>

              <v-divider class="my-4"></v-divider>

              <!-- Total -->
              <div
                class="d-flex justify-space-between align-center pa-4 bg-grey-lighten-4 rounded"
              >
                <span class="text-h6 font-weight-bold">Total Amount</span>
                <span class="text-h5 font-weight-bold text-primary">
                  {{ formatCurrency(orderSummary.total) }}
                </span>
              </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-4">
              <!-- Complete Button (only show for ready/preparing orders) -->
              <v-btn
                v-if="canCompleteOrder(selectedOrder)"
                color="success"
                variant="flat"
                prepend-icon="mdi-check-circle"
                @click="completeOrderFromDialog"
                :loading="processingComplete"
              >
                Mark as Completed
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn color="primary" variant="flat" @click="detailsDialog = false">
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Confirmation Dialog for Completing Order -->
        <v-dialog v-model="confirmDialog" max-width="400">
          <v-card>
            <v-card-title class="text-h6">Confirm Completion</v-card-title>
            <v-card-text>
              Are you sure you want to mark Order #{{ orderToComplete?.id }} (Table
              {{ orderToComplete?.table_id }}) as completed?
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="confirmDialog = false">Cancel</v-btn>
              <v-btn
                color="success"
                variant="flat"
                @click="completeOrder"
                :loading="processingComplete"
              >
                Confirm
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Snackbar -->
        <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
          {{ snackbarText }}
          <template v-slot:actions>
            <v-btn variant="text" @click="snackbar = false">Close</v-btn>
          </template>
        </v-snackbar>
      </v-container>
    </template>
  </InnerLayoutWrapper>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}

.gap-1 {
  gap: 4px;
}
</style>