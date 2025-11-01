<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useCashierDataStore } from "@/stores/cashierData";
import { formatCurrency, formatDate, getStatusColor, getStatusText, getImageUrl } from "@/utils/helpers";
import type { OrderWithMeals } from "@/stores/orderData";
import CashierStatistics from "@/pages/cashier/components/CashierStatistics.vue";
import PendingOrderDetailsDialog from "@/pages/cashier/dialogs/PendingOrderDetailsDialog.vue";

import InnerLayoutWrapper from "@/layouts/InnerLayoutWrapper.vue";

const router = useRouter();
const cashierStore = useCashierDataStore();

// State
const detailsDialog = ref(false);
const approveDialog = ref(false);
const rejectDialog = ref(false);
const orderToProcess = ref<OrderWithMeals | null>(null);
const rejectReason = ref("");
const processing = ref(false);
const loadingOrderId = ref<number | null>(null);
const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

// Computed
const pendingOrders = computed(() => cashierStore.pendingOrders);
const pendingOrdersCount = computed(() => cashierStore.pendingOrdersCount);
const todayOrdersCount = computed(() => cashierStore.todayOrdersCount);
const todayRevenue = computed(() => cashierStore.todayRevenue);
const loading = computed(() => cashierStore.loading);
const selectedOrder = computed(() => cashierStore.selectedOrder);

const uniqueTablesCount = computed(() => {
  const tables = new Set(pendingOrders.value.map((o) => o.table_id));
  return tables.size;
});

const orderSummary = computed(() => {
  if (!selectedOrder.value) return { items: [], total: 0, itemCount: 0 };
  return cashierStore.getOrderSummary(selectedOrder.value);
});

// Methods
const getOrderItemsSummary = (order: OrderWithMeals): string => {
  const summary = cashierStore.getOrderSummary(order);
  if (summary.items.length === 0) return "No items";
  
  const itemCount = summary.itemCount;
  const firstItem = summary.items[0];
  
  if (summary.items.length === 1) {
    return `${firstItem.meal.name} ×${firstItem.quantity}`;
  } else {
    return `${firstItem.meal.name} ×${firstItem.quantity} + ${summary.items.length - 1} more`;
  }
};

const viewOrderDetails = (order: OrderWithMeals): void => {
  cashierStore.getOrderDetails(order.id!);
  detailsDialog.value = true;
};

const confirmApprove = (order: OrderWithMeals): void => {
  orderToProcess.value = order;
  approveDialog.value = true;
  detailsDialog.value = false;
};

const confirmReject = (order: OrderWithMeals): void => {
  orderToProcess.value = order;
  rejectReason.value = "";
  rejectDialog.value = true;
  detailsDialog.value = false;
};

const handleApprove = async (): Promise<void> => {
  if (!orderToProcess.value?.id) return;
  
  try {
    processing.value = true;
    loadingOrderId.value = orderToProcess.value.id;
    
    const success = await cashierStore.approveOrder(orderToProcess.value.id);
    
    if (success) {
      snackbarText.value = `Order #${orderToProcess.value.id} approved and sent to kitchen`;
      snackbarColor.value = "success";
      snackbar.value = true;
      approveDialog.value = false;
      orderToProcess.value = null;
    }
  } catch (error) {
    snackbarText.value = "Failed to approve order";
    snackbarColor.value = "error";
    snackbar.value = true;
  } finally {
    processing.value = false;
    loadingOrderId.value = null;
  }
};

const handleReject = async (): Promise<void> => {
  if (!orderToProcess.value?.id) return;
  
  try {
    processing.value = true;
    loadingOrderId.value = orderToProcess.value.id;
    
    const success = await cashierStore.rejectOrder(
      orderToProcess.value.id,
      rejectReason.value
    );
    
    if (success) {
      snackbarText.value = `Order #${orderToProcess.value.id} rejected`;
      snackbarColor.value = "warning";
      snackbar.value = true;
      rejectDialog.value = false;
      orderToProcess.value = null;
      rejectReason.value = "";
    }
  } catch (error) {
    snackbarText.value = "Failed to reject order";
    snackbarColor.value = "error";
    snackbar.value = true;
  } finally {
    processing.value = false;
    loadingOrderId.value = null;
  }
};

const refreshOrders = async (): Promise<void> => {
  try {
    await cashierStore.fetchPendingOrders();
    // snackbarText.value = "Orders refreshed";
    // snackbarColor.value = "success";
    // snackbar.value = true;
  } catch (error) {
    snackbarText.value = "Failed to refresh orders";
    snackbarColor.value = "error";
    snackbar.value = true;
  }
};

const navigateToHistory = (): void => {
  router.push("/cashier/history");
};

// Lifecycle
onMounted(async () => {
  await cashierStore.fetchPendingOrders();
  cashierStore.subscribeToOrders();
});

onUnmounted(() => {
  cashierStore.unsubscribeFromOrders();
});
</script>
<template>
    <InnerLayoutWrapper>
    <template #content>
  <v-container fluid class="pa-4">
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <h1 class="text-h4 font-weight-bold">Cashier Orders</h1>
            <p class="text-subtitle-1 text-grey">
              Review and approve customer orders
            </p>
          </div>
          <div class="d-flex gap-2">
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-history"
              @click="navigateToHistory"
            >
              Order History
            </v-btn>
            <v-btn
              color="primary"
              prepend-icon="mdi-refresh"
              @click="refreshOrders"
              :loading="loading"
            >
              Refresh
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Statistics Cards -->
        <CashierStatistics
          :pending-orders-count="pendingOrdersCount"
          :today-orders-count="todayOrdersCount"
          :today-revenue="todayRevenue"
          :unique-tables-count="uniqueTablesCount"
        />

    <!-- Pending Orders List -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-h6">Pending Orders</span>
            <v-chip
              v-if="pendingOrdersCount > 0"
              color="orange"
              variant="flat"
              size="small"
            >
              {{ pendingOrdersCount }} waiting
            </v-chip>
          </v-card-title>

          <v-divider></v-divider>

          <!-- Empty State -->
          <div
            v-if="!loading && pendingOrders.length === 0"
            class="text-center py-12"
          >
            <v-icon size="64" color="grey-lighten-1">
              mdi-check-circle-outline
            </v-icon>
            <p class="text-h6 text-grey mt-4">No Pending Orders</p>
            <p class="text-body-2 text-grey">
              All orders have been processed
            </p>
          </div>

          <!-- Loading State -->
          <div v-else-if="loading" class="text-center py-12">
            <v-progress-circular
              indeterminate
              color="primary"
              size="48"
            ></v-progress-circular>
            <p class="text-body-2 text-grey mt-4">Loading orders...</p>
          </div>

          <!-- Orders List -->
          <v-list v-else lines="three">
            <template
              v-for="(order, index) in pendingOrders"
              :key="order.id"
            >
              <v-list-item @click="viewOrderDetails(order)">
                <template v-slot:prepend>
                  <v-avatar color="orange-lighten-4" size="56">
                    <span class="text-h6 text-orange">
                      #{{ order.id }}
                    </span>
                  </v-avatar>
                </template>

                <v-list-item-title class="text-h6 mb-1">
                  Table {{ order.table_id }}
                </v-list-item-title>

                <v-list-item-subtitle>
                  <div class="d-flex flex-column">
                    <span class="text-body-2">
                      {{ getOrderItemsSummary(order) }}
                    </span>
                    <span class="text-caption text-grey mt-1">
                      <v-icon size="14">mdi-clock-outline</v-icon>
                      {{ formatDate(order.created_at) }}
                    </span>
                  </div>
                </v-list-item-subtitle>

                <template v-slot:append>
                  <div class="d-flex flex-column align-end">
                    <div class="text-h6 font-weight-bold mb-2">
                      {{ formatCurrency(order.total_amount) }}
                    </div>
                    <div class="d-flex gap-2">
                      <v-btn
                        color="error"
                        variant="outlined"
                        size="small"
                        @click.stop="confirmReject(order)"
                        :loading="loadingOrderId === order.id"
                      >
                        Reject
                      </v-btn>
                      <v-btn
                        color="success"
                        variant="flat"
                        size="small"
                        @click.stop="confirmApprove(order)"
                        :loading="loadingOrderId === order.id"
                      >
                        Approve
                      </v-btn>
                    </div>
                  </div>
                </template>
              </v-list-item>

              <v-divider
                v-if="index < pendingOrders.length - 1"
                :key="`divider-${order.id}`"
              ></v-divider>
            </template>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Order Details Dialog -->
        <PendingOrderDetailsDialog
          v-model="detailsDialog"
          :order="selectedOrder"
          :order-summary="orderSummary"
          @approve="confirmApprove"
          @reject="confirmReject"
        />

    <!-- Confirm Approve Dialog -->
    <v-dialog v-model="approveDialog" max-width="400">
      <v-card>
        <v-card-title>Approve Order?</v-card-title>
        <v-card-text>
          Are you sure you want to approve Order #{{ orderToProcess?.id }} for
          Table {{ orderToProcess?.table_id }}? This will send the order to the
          kitchen.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="approveDialog = false">Cancel</v-btn>
          <v-btn
            color="success"
            variant="flat"
            @click="handleApprove"
            :loading="processing"
          >
            Approve
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Reject Dialog -->
    <v-dialog v-model="rejectDialog" max-width="400">
      <v-card>
        <v-card-title>Reject Order?</v-card-title>
        <v-card-text>
          <p class="mb-4">
            Are you sure you want to reject Order #{{ orderToProcess?.id }} for
            Table {{ orderToProcess?.table_id }}?
          </p>
          <v-textarea
            v-model="rejectReason"
            label="Reason for rejection (optional)"
            rows="3"
            variant="outlined"
            hide-details
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="rejectDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="handleReject"
            :loading="processing"
          >
            Reject
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
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
</style>
