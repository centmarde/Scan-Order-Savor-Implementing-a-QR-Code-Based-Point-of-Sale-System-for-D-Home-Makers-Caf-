<script setup lang="ts">
import { computed } from "vue";
import { APP_CONFIG } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";
import type { MenuItem } from "@/stores/menuData";

// Props
interface Props {
  menuItems: MenuItem[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  addToCart: [item: MenuItem];
}>();

// Theme colors
const { primaryColor, secondaryColor, textPrimary } = useTheme();

// Computed properties
const bestSellers = computed(() => {
  // Get top 3 items by sales (including items with 0 sales if needed)
  return props.menuItems
    .sort((a, b) => (b.sales || 0) - (a.sales || 0))
    .slice(0, 3);
});

// Check if item has reached max quantity in cart
const isMaxQuantityInCart = (itemId: number, maxQuantity: number): boolean => {
  const cartItems = JSON.parse(sessionStorage.getItem('cartItems') || '[]');
  const currentQuantityInCart = cartItems.filter((item: MenuItem) => item.id === itemId).length;
  return currentQuantityInCart >= maxQuantity;
};

// Check if item can be added to cart
const canAddToCart = (item: MenuItem): boolean => {
  return item.quantity > 0 && !isMaxQuantityInCart(item.id, item.quantity);
};

// Methods
const addToCart = (item: MenuItem) => {
  emit("addToCart", item);
};
</script>

<template>
  <!-- Best Sellers Section -->
  <v-container class="px-4 py-6">
    <div class="d-flex align-center mb-4">
      <v-icon :style="{ color: primaryColor }" size="24" class="mr-2"
        >mdi-fire</v-icon
      >
      <h2 class="text-h6 font-weight-bold" :style="{ color: primaryColor }">
        Most Popular
      </h2>
    </div>

    <v-row dense v-if="bestSellers.length > 0">
      <v-col v-for="item in bestSellers" :key="item.id" cols="12">
        <!-- FoodPanda-style horizontal item card -->
        <v-card
          elevation="1"
          class="mb-3"
          @click="canAddToCart(item) ? addToCart(item) : undefined"
          rounded="xl"
          :hover="canAddToCart(item)"
          :disabled="!canAddToCart(item)"
          :class="{ 'opacity-60': !canAddToCart(item) }"
        >
          <v-card-text class="pa-3">
            <div class="d-flex">
              <div class="flex-grow-1 pr-3">
                <h3
                  class="text-body-1 font-weight-bold mb-1"
                  :style="{ color: '#2D2D2D' }"
                >
                  {{ item.name }}
                </h3>
                <p class="text-caption mb-2" :style="{ color: '#555555' }">
                  {{ item.description }}
                </p>

                <!-- Quantity display -->
                <div class="mb-2">
                  <v-chip
                    size="x-small"
                    variant="flat"
                    :class="item.quantity === 0 || isMaxQuantityInCart(item.id, item.quantity) ? 'text-white' : item.quantity <= 5 ? 'text-white' : 'text-grey-darken-1'"
                    :style="{
                      backgroundColor: item.quantity === 0 ? '#f44336' : isMaxQuantityInCart(item.id, item.quantity) ? '#2196f3' : item.quantity <= 5 ? '#ff9800' : '#e0e0e0'
                    }"
                  >
                    <v-icon size="10" class="mr-1">
                      {{ item.quantity === 0 ? 'mdi-close-circle' : isMaxQuantityInCart(item.id, item.quantity) ? 'mdi-check-circle' : 'mdi-package-variant' }}
                    </v-icon>
                    {{ item.quantity === 0 ? 'Out of Stock' : isMaxQuantityInCart(item.id, item.quantity) ? 'Max in Cart' : `${item.quantity} available` }}
                  </v-chip>
                </div>

                <span
                  class="text-h6 font-weight-bold"
                  :style="{ color: primaryColor }"
                >
                  {{ APP_CONFIG.CURRENCY }}{{ item.price.toFixed(2) }}
                </span>
              </div>
              <div class="d-flex flex-column align-center">
                <div class="position-relative mb-2">
                  <v-img
                    :src="item.image"
                    :alt="item.name"
                    width="80"
                    height="80"
                    cover
                    class="rounded-lg"
                  />
                  <v-chip
                    size="x-small"
                    class="position-absolute"
                    style="top: -4px; left: -4px"
                    :style="{ backgroundColor: primaryColor, color: 'white' }"
                    variant="flat"
                  >
                    <v-icon size="12" class="mr-1">mdi-fire</v-icon>
                    Popular
                  </v-chip>
                </div>
                <v-btn
                  v-if="canAddToCart(item)"
                  @click.stop="addToCart(item)"
                  icon
                  size="small"
                  variant="flat"
                  :style="{ backgroundColor: primaryColor, color: 'white' }"
                >
                  <v-icon size="20">mdi-plus</v-icon>
                </v-btn>
                <v-btn
                  v-else
                  disabled
                  icon
                  size="small"
                  variant="outlined"
                  :style="{ borderColor: '#ccc', color: '#ccc' }"
                >
                  <v-icon size="20">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
