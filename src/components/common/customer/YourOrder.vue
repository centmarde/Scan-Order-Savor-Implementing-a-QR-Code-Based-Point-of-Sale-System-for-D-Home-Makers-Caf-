<script setup lang="ts">
import { computed } from "vue";
import { APP_CONFIG } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";
import type { MenuItem } from "@/stores/menuData";

// Props
interface Props {
  cartItems: MenuItem[];
}

const props = defineProps<Props>();

// Emits

const emit = defineEmits<{
  viewCart: [];
  cancelOrder: [];
  reviewOrder: [];
  removeItem: [itemId: number];
  addItem: [itemId: number];
}>();

// Theme colors
const { primaryColor, secondaryColor } = useTheme();

// Computed properties
const groupedCartItems = computed(() => {
  const grouped: { [key: number]: { item: MenuItem; quantity: number } } = {};

  props.cartItems.forEach((item) => {
    if (grouped[item.id]) {
      grouped[item.id].quantity += 1;
    } else {
      grouped[item.id] = { item, quantity: 1 };
    }
  });

  return Object.values(grouped);
});

const cartTotal = computed(() => {
  return props.cartItems.reduce(
    (total: number, item: MenuItem) => total + item.price,
    0
  );
});

const itemCount = computed(() => props.cartItems.length);

// Methods

const cancelOrder = () => {
  emit("cancelOrder");
};

const reviewOrder = () => {
  emit("reviewOrder");
};

const removeItem = (itemId: number) => {
  emit("removeItem", itemId);
};

const addItem = (itemId: number) => {
  emit("addItem", itemId);
};
</script>

<template>
  <div
    v-if="cartItems.length > 0"
    class="position-sticky pb-4"
    style="bottom: 0; z-index: 10; background: #f5f3ef"
  >
    <!-- Your Order Header -->
    <v-card
      class="mx-4 mb-4"
      elevation="8"
      rounded="xl"
      :style="{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: '1px solid rgba(139, 92, 42, 0.1)',
      }"
    >
      <v-card-text class="pa-5">
        <!-- Header with Your Order -->
        <div class="d-flex align-center mb-4">
          <v-icon :style="{ color: primaryColor }" size="24" class="mr-2">
            mdi-cart
          </v-icon>
          <h3 class="text-h6 font-weight-bold" :style="{ color: '#2D2D2D' }">
            Your Order
          </h3>
          <v-spacer />
          <v-chip
            size="small"
            variant="flat"
            :style="{ backgroundColor: primaryColor, color: 'white' }"
            class="ml-2"
          >
            {{ itemCount }} item{{ itemCount > 1 ? "s" : "" }}
          </v-chip>
        </div>

        <!-- Order Items List -->
        <v-card
          variant="flat"
          class="mb-4"
          rounded="lg"
          style="background-color: #f8f9fa"
        >
          <v-list
            class="pa-3"
            max-height="180"
            style="overflow-y: auto; background: transparent"
          >
            <v-list-item
              v-for="groupedItem in groupedCartItems"
              :key="groupedItem.item.id"
              class="px-4 py-3 mb-2 rounded-lg elevation-1"
              :style="{
                backgroundColor: '#ffffff',
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }"
            >
              <template v-slot:prepend>
                <div class="position-relative mr-3">
                  <v-avatar
                    size="40"
                    class="elevation-2"
                    :style="{
                      border: '2px solid #ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }"
                  >
                    <v-img
                      :src="groupedItem.item.image"
                      :alt="groupedItem.item.name"
                      cover
                    />
                  </v-avatar>
                  <v-chip
                    v-if="groupedItem.quantity > 1"
                    size="x-small"
                    class="position-absolute"
                    :style="{
                      top: '-5px',
                      right: '-5px',
                      backgroundColor: primaryColor,
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }"
                  >
                    {{ groupedItem.quantity }}x
                  </v-chip>
                </div>
              </template>

              <v-list-item-content>
                <v-list-item-title
                  class="text-body-2 font-weight-bold mb-1"
                  :style="{ color: '#2D2D2D' }"
                >
                  {{ groupedItem.item.name }}
                  <span
                    v-if="groupedItem.quantity > 1"
                    class="text-caption ml-1"
                    :style="{ color: primaryColor, fontWeight: 'bold' }"
                  >
                    ({{ groupedItem.quantity }}x)
                  </span>
                </v-list-item-title>
                <v-list-item-subtitle
                  class="text-caption font-weight-medium"
                  :style="{ color: primaryColor }"
                >
                  {{ APP_CONFIG.CURRENCY
                  }}{{ groupedItem.item.price.toFixed(2) }} each
                  <span v-if="groupedItem.quantity > 1" class="ml-1">
                    • Total: {{ APP_CONFIG.CURRENCY
                    }}{{
                      (groupedItem.item.price * groupedItem.quantity).toFixed(2)
                    }}
                  </span>
                </v-list-item-subtitle>
              </v-list-item-content>

              <template v-slot:append>
                <div class="d-flex align-center">
                  <v-btn
                    @click="removeItem(groupedItem.item.id)"
                    icon
                    size="small"
                    variant="text"
                    class="ml-1"
                    :style="{ color: '#dc3545' }"
                  >
                    <v-icon size="18">mdi-minus-circle</v-icon>
                  </v-btn>
                  <v-btn
                    @click="addItem(groupedItem.item.id)"
                    icon
                    size="small"
                    variant="text"
                    :style="{ color: primaryColor }"
                  >
                    <v-icon size="18">mdi-plus-circle</v-icon>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Bottom Action Buttons -->
        <v-divider class="my-3"></v-divider>

        <v-row class="align-center" dense no-gutters>
          <!-- Cancel Button -->
          <v-col cols="3">
            <v-btn
              @click="cancelOrder"
              variant="outlined"
              size="default"
              rounded="pill"
              color="error"
              block
              class="text-caption font-weight-bold"
            >
              CANCEL
            </v-btn>
          </v-col>

          <!-- Review + Pay Button -->
          <v-col cols="6" class="px-3">
            <v-btn
              @click="reviewOrder"
              variant="flat"
              size="default"
              rounded="pill"
              :style="{ backgroundColor: primaryColor, color: 'white' }"
              block
              class="text-caption font-weight-bold"
              elevation="2"
            >
              <span class="d-sm-inline">REVIEW + PAY</span>
            </v-btn>
          </v-col>

          <!-- Total Amount -->
          <v-col cols="3">
            <v-card
              variant="outlined"
              rounded="pill"
              :style="{ borderColor: primaryColor, borderWidth: '2px' }"
              class="pa-2 text-center"
            >
              <span
                class="text-caption font-weight-bold"
                :style="{ color: primaryColor }"
              >
                {{ APP_CONFIG.CURRENCY }}{{ cartTotal.toFixed(2) }}
              </span>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>
