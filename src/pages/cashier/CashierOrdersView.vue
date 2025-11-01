<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useCashierDataStore } from "@/stores/cashierData";
import { formatCurrency, formatDate, getStatusColor, getStatusText, getImageUrl } from "@/utils/helpers";
import type { OrderWithMeals } from "@/stores/orderData";
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
    <v-dialog v-model="detailsDialog" max-width="600">
      <v-card v-if="selectedOrder">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Order #{{ selectedOrder.id }} Details</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="detailsDialog = false"
          ></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <!-- Order Info -->
          <div class="mb-4">
            <div class="d-flex justify-space-between mb-2">
              <span class="text-grey">Table Number:</span>
              <span class="font-weight-bold">{{ selectedOrder.table_id }}</span>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-grey">Order Time:</span>
              <span>{{ formatDate(selectedOrder.created_at) }}</span>
            </div>
            <div class="d-flex justify-space-between">
              <span class="text-grey">Status:</span>
              <v-chip :color="getStatusColor(selectedOrder.status)" size="small">
                {{ getStatusText(selectedOrder.status) }}
              </v-chip>
            </div>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- Order Items -->
          <div class="mb-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-3">Order Items</h3>
            <div
              v-for="item in orderSummary.items"
              :key="item.meal.id"
              class="d-flex justify-space-between align-center mb-3"
            >
              <div class="d-flex align-center">
                <v-avatar size="48" class="mr-3" rounded>
                  <v-img :src="getImageUrl(item.meal.image)"></v-img>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">{{ item.meal.name }}</div>
                  <div class="text-caption text-grey">
                    {{ formatCurrency(item.meal.price) }} × {{ item.quantity }}
                  </div>
                </div>
              </div>
              <div class="font-weight-bold">
                {{ formatCurrency(item.subtotal) }}
              </div>
            </div>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- Total -->
          <div class="d-flex justify-space-between align-center">
            <span class="text-h6 font-weight-bold">Total</span>
            <span class="text-h6 font-weight-bold text-primary">
              {{ formatCurrency(orderSummary.total) }}
            </span>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="outlined"
            @click="confirmReject(selectedOrder)"
          >
            Reject Order
          </v-btn>
          <v-btn
            color="success"
            variant="flat"
            @click="confirmApprove(selectedOrder)"
          >
            Approve & Send to Kitchen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
