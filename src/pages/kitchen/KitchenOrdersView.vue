<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useKitchenDataStore } from "@/stores/kitchennData";
import { formatCurrency, formatDate, getStatusColor, getStatusText, getImageUrl } from "@/utils/helpers";
import type { OrderWithMeals } from "@/stores/orderData";
import InnerLayoutWrapper from "@/layouts/InnerLayoutWrapper.vue";

const router = useRouter();
const kitchenStore = useKitchenDataStore();

// State
const detailsDialog = ref(false);
const completeDialog = ref(false);
const orderToProcess = ref<OrderWithMeals | null>(null);
const processing = ref(false);
const loadingOrderId = ref<number | null>(null);
const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");
const activeTab = ref<"preparing" | "ready">("preparing");

// Computed
const preparingOrders = computed(() => kitchenStore.preparingOrders);
const readyOrders = computed(() => kitchenStore.readyOrders);
const preparingCount = computed(() => kitchenStore.preparingOrdersCount);
const readyCount = computed(() => kitchenStore.readyOrdersCount);
const todayCompletedCount = computed(() => kitchenStore.todayCompletedCount);
const loading = computed(() => kitchenStore.loading);
const selectedOrder = computed(() => kitchenStore.selectedOrder);

const averagePrepTime = computed(() => {
  return kitchenStore.averagePrepTime;
});

const orderSummary = computed(() => {
  if (!selectedOrder.value) return { items: [], total: 0, itemCount: 0 };
  return kitchenStore.getOrderSummary(selectedOrder.value);
});

const displayedOrders = computed(() => {
  return activeTab.value === "preparing" ? preparingOrders.value : readyOrders.value;
});

// Methods
const getOrderItemsSummary = (order: OrderWithMeals): string => {
  const summary = kitchenStore.getOrderSummary(order);
  if (summary.items.length === 0) return "No items";
  
  const itemCount = summary.itemCount;
  const firstItem = summary.items[0];
  
  if (summary.items.length === 1) {
    return `${firstItem.meal.name} ×${firstItem.quantity}`;
  } else {
    return `${firstItem.meal.name} ×${firstItem.quantity} + ${summary.items.length - 1} more`;
  }
};

const getOrderWaitTime = (createdAt: string | undefined): string => {
  if (!createdAt) return "Unknown";
  const now = new Date();
  const created = new Date(createdAt);
  const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes === 1) return "1 min ago";
  return `${diffMinutes} mins ago`;
};

const getWaitTimeColor = (createdAt: string | undefined): string => {
  if (!createdAt) return "grey";
  const now = new Date();
  const created = new Date(createdAt);
  const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
  
  if (diffMinutes < 10) return "success";
  if (diffMinutes < 20) return "warning";
  return "error";
};

const viewOrderDetails = (order: OrderWithMeals): void => {
  kitchenStore.getOrderDetails(order.id!);
  detailsDialog.value = true;
};

const confirmComplete = (order: OrderWithMeals): void => {
  orderToProcess.value = order;
  completeDialog.value = true;
  detailsDialog.value = false;
};

const handleComplete = async (): Promise<void> => {
  if (!orderToProcess.value?.id) return;
  
  try {
    processing.value = true;
    loadingOrderId.value = orderToProcess.value.id;
    
    const success = await kitchenStore.completeOrder(orderToProcess.value.id);
    
    if (success) {
      snackbarText.value = `Order #${orderToProcess.value.id} marked as ready`;
      snackbarColor.value = "success";
      snackbar.value = true;
      completeDialog.value = false;
      orderToProcess.value = null;
    }
  } catch (error) {
    snackbarText.value = "Failed to complete order";
    snackbarColor.value = "error";
    snackbar.value = true;
  } finally {
    processing.value = false;
    loadingOrderId.value = null;
  }
};

const refreshOrders = async (): Promise<void> => {
  try {
    await kitchenStore.fetchKitchenOrders();
    // snackbarText.value = "Orders refreshed";
    // snackbarColor.value = "success";
    // snackbar.value = true;
  } catch (error) {
    snackbarText.value = "Failed to refresh orders";
    snackbarColor.value = "error";
    snackbar.value = true;
  }
};

// Lifecycle
onMounted(async () => {
  await kitchenStore.fetchKitchenOrders();
  kitchenStore.subscribeToOrders();
});

onUnmounted(() => {
  kitchenStore.unsubscribeFromOrders();
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
                <h1 class="text-h4 font-weight-bold">Kitchen Orders</h1>
                <p class="text-subtitle-1 text-grey">
                  Prepare and manage orders
                </p>
              </div>
              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                @click="refreshOrders"
                :loading="loading"
              >
                Refresh
              </v-btn>
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
                    <v-icon color="orange" size="28">mdi-chef-hat</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-h5 font-weight-bold">
                      {{ preparingCount }}
                    </div>
                    <div class="text-caption text-grey">Preparing</div>
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
                    <v-icon color="green" size="28">mdi-check-circle</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-h5 font-weight-bold">
                      {{ readyCount }}
                    </div>
                    <div class="text-caption text-grey">Ready to Serve</div>
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
                    <v-icon color="blue" size="28">mdi-clipboard-check</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-h5 font-weight-bold">
                      {{ todayCompletedCount }}
                    </div>
                    <div class="text-caption text-grey">Today's Completed</div>
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
                    <v-icon color="purple" size="28">mdi-clock-fast</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-h5 font-weight-bold">
                      {{ averagePrepTime }} min
                    </div>
                    <div class="text-caption text-grey">Avg. Prep Time</div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Orders Tabs -->
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-tabs v-model="activeTab" bg-color="primary" dark>
                <v-tab value="preparing">
                  <v-icon start>mdi-chef-hat</v-icon>
                  Preparing ({{ preparingCount }})
                </v-tab>
                <v-tab value="ready">
                  <v-icon start>mdi-check-circle</v-icon>
                  Ready ({{ readyCount }})
                </v-tab>
              </v-tabs>

              <v-divider></v-divider>

              <v-window v-model="activeTab">
                <!-- Preparing Tab -->
                <v-window-item value="preparing">
                  <!-- Empty State -->
                  <div
                    v-if="!loading && preparingOrders.length === 0"
                    class="text-center py-12"
                  >
                    <v-icon size="64" color="grey-lighten-1">
                      mdi-chef-hat
                    </v-icon>
                    <p class="text-h6 text-grey mt-4">No Orders to Prepare</p>
                    <p class="text-body-2 text-grey">
                      Waiting for approved orders from cashier
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
                      v-for="(order, index) in preparingOrders"
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
                            <span class="text-caption mt-1">
                              <v-chip
                                :color="getWaitTimeColor(order.created_at)"
                                size="x-small"
                                variant="flat"
                              >
                                <v-icon start size="12">mdi-clock-outline</v-icon>
                                {{ getOrderWaitTime(order.created_at) }}
                              </v-chip>
                            </span>
                          </div>
                        </v-list-item-subtitle>

                        <template v-slot:append>
                          <div class="d-flex flex-column align-end">
                            <v-chip
                              color="orange"
                              variant="flat"
                              size="small"
                              class="mb-2"
                            >
                              Preparing
                            </v-chip>
                            <v-btn
                              color="success"
                              variant="flat"
                              size="small"
                              @click.stop="confirmComplete(order)"
                              :loading="loadingOrderId === order.id"
                            >
                              Mark Ready
                            </v-btn>
                          </div>
                        </template>
                      </v-list-item>

                      <v-divider
                        v-if="index < preparingOrders.length - 1"
                        :key="`divider-${order.id}`"
                      ></v-divider>
                    </template>
                  </v-list>
                </v-window-item>

                <!-- Ready Tab -->
                <v-window-item value="ready">
                  <!-- Empty State -->
                  <div
                    v-if="!loading && readyOrders.length === 0"
                    class="text-center py-12"
                  >
                    <v-icon size="64" color="grey-lighten-1">
                      mdi-check-circle-outline
                    </v-icon>
                    <p class="text-h6 text-grey mt-4">No Orders Ready</p>
                    <p class="text-body-2 text-grey">
                      Completed orders will appear here
                    </p>
                  </div>

                  <!-- Orders List -->
                  <v-list v-else lines="three">
                    <template
                      v-for="(order, index) in readyOrders"
                      :key="order.id"
                    >
                      <v-list-item @click="viewOrderDetails(order)">
                        <template v-slot:prepend>
                          <v-avatar color="green-lighten-4" size="56">
                            <span class="text-h6 text-green">
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
                              <v-icon size="14">mdi-check</v-icon>
                              Ready for serving
                            </span>
                          </div>
                        </v-list-item-subtitle>

                        <template v-slot:append>
                          <v-chip
                            color="success"
                            variant="flat"
                            size="small"
                          >
                            <v-icon start size="16">mdi-check-circle</v-icon>
                            Ready
                          </v-chip>
                        </template>
                      </v-list-item>

                      <v-divider
                        v-if="index < readyOrders.length - 1"
                        :key="`divider-${order.id}`"
                      ></v-divider>
                    </template>
                  </v-list>
                </v-window-item>
              </v-window>
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
                        Quantity: {{ item.quantity }}
                      </div>
                    </div>
                  </div>
                  <v-chip
                    v-if="item.quantity > 1"
                    color="primary"
                    variant="outlined"
                    size="small"
                  >
                    ×{{ item.quantity }}
                  </v-chip>
                </div>
              </div>

              <v-divider class="my-4"></v-divider>

              <!-- Total Items -->
              <div class="d-flex justify-space-between align-center">
                <span class="text-h6 font-weight-bold">Total Items</span>
                <span class="text-h6 font-weight-bold text-primary">
                  {{ orderSummary.itemCount }}
                </span>
              </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-4" v-if="selectedOrder.status === 'preparing'">
              <v-spacer></v-spacer>
              <v-btn
                color="success"
                variant="flat"
                @click="confirmComplete(selectedOrder)"
                prepend-icon="mdi-check"
              >
                Mark as Ready
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Confirm Complete Dialog -->
        <v-dialog v-model="completeDialog" max-width="400">
          <v-card>
            <v-card-title>Mark Order as Ready?</v-card-title>
            <v-card-text>
              Are you sure Order #{{ orderToProcess?.id }} for Table {{ orderToProcess?.table_id }} 
              is ready to be served?
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="completeDialog = false">Cancel</v-btn>
              <v-btn
                color="success"
                variant="flat"
                @click="handleComplete"
                :loading="processing"
              >
                Mark Ready
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
</style>