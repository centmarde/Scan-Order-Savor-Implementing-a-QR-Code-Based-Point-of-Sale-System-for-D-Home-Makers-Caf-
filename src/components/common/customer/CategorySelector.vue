<script setup lang="ts">
import { ref, computed } from "vue";
import { APP_CONFIG } from "@/utils/constants";
import { useThemeColors } from "@/composables/useThemeColors";
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

// Reactive data
const selectedCategory = ref<string>("All");

// Theme colors
const { primaryColor, secondaryColor, textPrimary } = useThemeColors();

// Computed properties
const allCategories = computed(() => {
  // Get unique categories from menu items and add "All" at the beginning
  const categorySet = new Set(
    props.menuItems
      .map((item) => item.category)
      .filter((category): category is string => Boolean(category))
  );
  return ["All", ...Array.from(categorySet)];
});

const filteredMenuItems = computed(() => {
  if (selectedCategory.value === "All") {
    return props.menuItems;
  }
  return props.menuItems.filter(
    (item) => item.category === selectedCategory.value
  );
});

// Methods
const selectCategory = (category: string) => {
  selectedCategory.value = category;
};

const getCategoryIcon = (category: string) => {
  // Map category names to appropriate icons
  const iconMap: { [key: string]: string } = {
    All: "mdi-food",
    "Main Course": "mdi-food",
    Appetizer: "mdi-food-variant",
    Dessert: "mdi-cake",
    Beverage: "mdi-cup",
    Coffee: "mdi-coffee",
    Tea: "mdi-tea",
    Snack: "mdi-cookie",
    Soup: "mdi-bowl-mix",
    Salad: "mdi-food-apple",
    Sandwich: "mdi-food-croissant",
    Pizza: "mdi-pizza",
    Pasta: "mdi-pasta",
  };
  return iconMap[category] || "mdi-food";
};

const addToCart = (item: MenuItem) => {
  emit("addToCart", item);
};
</script>

<template>
  <!-- Category Chips -->
  <v-container class="px-4 py-2">
    <div class="d-flex overflow-x-auto pb-2" style="gap: 8px">
      <v-chip
        v-for="category in allCategories"
        :key="category"
        @click="selectCategory(category)"
        :variant="selectedCategory === category ? 'flat' : 'outlined'"
        :style="
          selectedCategory === category
            ? { backgroundColor: primaryColor, color: 'white' }
            : { borderColor: secondaryColor, color: secondaryColor }
        "
        class="flex-shrink-0"
        rounded="xl"
        size="default"
      >
        <template v-slot:prepend>
          <v-icon size="18" class="mr-1">
            {{ getCategoryIcon(category) }}
          </v-icon>
        </template>
        {{ category }}
      </v-chip>
    </div>
  </v-container>

  <!-- Menu Items Section -->
  <v-container class="px-4 pb-6">
    <div class="d-flex align-center justify-between mb-4">
      <div class="d-flex align-center">
        <v-icon :style="{ color: primaryColor }" size="24" class="mr-2"
          >mdi-food</v-icon
        >
        <h2 class="text-h6 font-weight-bold" :style="{ color: primaryColor }">
          {{ selectedCategory === "All" ? "All Items" : selectedCategory }}
        </h2>
      </div>
      <v-chip
        class="ml-2"
        size="small"
        variant="flat"
        :style="{ backgroundColor: primaryColor, color: 'white' }"
      >
        {{ filteredMenuItems.length }} items
      </v-chip>
    </div>

    <!-- Menu Items List -->
    <div v-if="filteredMenuItems.length > 0">
      <v-card
        v-for="item in filteredMenuItems"
        :key="item.id"
        elevation="1"
        class="mb-3"
        @click="addToCart(item)"
        rounded="xl"
        hover
        :disabled="item.quantity === 0"
      >
        <v-card-text class="pa-3">
          <div class="d-flex">
            <div class="flex-grow-1 pr-3">
              <h3
                class="text-body-1 font-weight-bold mb-1"
                :style="{ color: primaryColor }"
              >
                {{ item.name }}
              </h3>
              <p class="text-caption mb-2" :style="{ color: secondaryColor }">
                {{ item.description }}
              </p>

              <!-- Stock indicator -->
              <div v-if="item.quantity > 0 && item.quantity <= 5" class="mb-2">
                <v-chip
                  size="x-small"
                  variant="flat"
                  class="text-white"
                  :style="{ backgroundColor: primaryColor }"
                >
                  Only {{ item.quantity }} left
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
                <v-overlay
                  v-if="item.quantity === 0"
                  contained
                  class="d-flex align-center justify-center rounded-lg"
                >
                  <span class="text-white text-caption font-weight-bold">
                    Out of Stock
                  </span>
                </v-overlay>
              </div>
              <v-btn
                v-if="item.quantity > 0"
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
                :style="{ borderColor: secondaryColor, color: secondaryColor }"
              >
                <v-icon size="20">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- No Items State -->
    <v-card v-else class="text-center pa-8" variant="outlined" rounded="xl">
      <v-icon :style="{ color: secondaryColor }" size="64" class="mb-4"
        >mdi-food-off</v-icon
      >
      <p class="text-h6 mb-2" :style="{ color: textPrimary }">
        No Items Available
      </p>
      <p class="text-body-2" :style="{ color: secondaryColor }">
        No items found in this category.
      </p>
    </v-card>
  </v-container>
</template>
