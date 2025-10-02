<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { APP_CONFIG } from "@/utils/constants";

// Props
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
  sales: number;
  category?: string;
  created_at: string;
}

interface Props {
  modelValue: boolean;
  menuItems?: MenuItem[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  addToCart: [item: MenuItem];
}>();

// Reactive data
const searchQuery = ref("");

// Computed properties
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const filteredSearchResults = computed(() => {
  if (!props.menuItems || !searchQuery.value.trim()) {
    return [];
  }

  const query = searchQuery.value.toLowerCase().trim();
  return props.menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.category && item.category.toLowerCase().includes(query))
  );
});

// Methods
const closeDialog = () => {
  isOpen.value = false;
  searchQuery.value = "";
};

const addToCart = (item: MenuItem) => {
  emit("addToCart", item);
  // Optional: close modal after adding to cart
  // closeDialog();
};

// Watch for dialog opening to clear search
watch(isOpen, (newValue) => {
  if (newValue) {
    searchQuery.value = "";
  }
});
</script>

<template>
  <!-- Search Modal -->
  <v-dialog v-model="isOpen" max-width="500" persistent>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-between pa-4">
        <h3 class="text-h6 font-weight-bold text-grey-darken-3">Search Menu</h3>
        <v-btn icon variant="text" size="small" @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="px-4 pb-4">
        <!-- Search Input -->
        <v-text-field
          v-model="searchQuery"
          placeholder="Search for meals, drinks, or categories..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded="xl"
          clearable
          autofocus
          hide-details
          class="mb-4"
        />

        <!-- Search Results -->
        <div v-if="searchQuery.trim()">
          <!-- Results Found -->
          <div v-if="filteredSearchResults.length > 0">
            <p class="text-body-2 text-grey-darken-1 mb-3">
              {{ filteredSearchResults.length }} result{{
                filteredSearchResults.length > 1 ? "s" : ""
              }}
              found
            </p>

            <div
              class="search-results"
              style="max-height: 400px; overflow-y: auto"
            >
              <v-card
                v-for="item in filteredSearchResults"
                :key="item.id"
                elevation="1"
                class="mb-3"
                @click="addToCart(item)"
                rounded="lg"
                hover
                :disabled="item.quantity === 0"
              >
                <v-card-text class="pa-3">
                  <div class="d-flex">
                    <div class="flex-grow-1 pr-3">
                      <h4
                        class="text-body-1 font-weight-bold text-grey-darken-3 mb-1"
                      >
                        {{ item.name }}
                      </h4>
                      <p class="text-caption text-grey-darken-1 mb-2">
                        {{ item.description }}
                      </p>

                      <!-- Category chip -->
                      <v-chip
                        v-if="item.category"
                        size="x-small"
                        color="orange-lighten-3"
                        variant="flat"
                        class="mb-2"
                      >
                        {{ item.category }}
                      </v-chip>

                      <!-- Stock indicator -->
                      <div
                        v-if="item.quantity > 0 && item.quantity <= 5"
                        class="mb-2"
                      >
                        <v-chip
                          size="x-small"
                          color="orange"
                          variant="flat"
                          class="text-white"
                        >
                          Only {{ item.quantity }} left
                        </v-chip>
                      </div>

                      <span
                        class="text-h6 font-weight-bold"
                        :class="
                          item.quantity === 0
                            ? 'text-grey'
                            : 'text-orange-darken-2'
                        "
                      >
                        {{ APP_CONFIG.CURRENCY }}{{ item.price.toFixed(2) }}
                      </span>
                    </div>

                    <div class="d-flex flex-column align-center">
                      <div class="position-relative mb-2">
                        <v-img
                          :src="item.image"
                          :alt="item.name"
                          width="60"
                          height="60"
                          cover
                          class="rounded-lg"
                        />
                        <v-overlay
                          v-if="item.quantity === 0"
                          contained
                          class="d-flex align-center justify-center rounded-lg"
                        >
                          <span
                            class="text-white text-caption font-weight-bold"
                          >
                            Out of Stock
                          </span>
                        </v-overlay>
                      </div>

                      <v-btn
                        v-if="item.quantity > 0"
                        @click.stop="addToCart(item)"
                        icon
                        size="small"
                        color="orange-darken-2"
                        variant="flat"
                      >
                        <v-icon size="18">mdi-plus</v-icon>
                      </v-btn>
                      <v-btn
                        v-else
                        disabled
                        icon
                        size="small"
                        variant="outlined"
                      >
                        <v-icon size="18">mdi-close</v-icon>
                      </v-btn>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>

          <!-- No Results -->
          <div v-else class="text-center py-8">
            <v-icon color="grey-lighten-1" size="64" class="mb-4">
              mdi-food-off
            </v-icon>
            <p class="text-h6 text-grey-darken-1 mb-2">No Results Found</p>
            <p class="text-body-2 text-grey">
              Try searching with different keywords
            </p>
          </div>
        </div>

        <!-- Search Prompt -->
        <div v-else class="text-center py-8">
          <v-icon color="orange-darken-2" size="64" class="mb-4">
            mdi-magnify
          </v-icon>
          <p class="text-h6 text-grey-darken-1 mb-2">Search for Menu Items</p>
          <p class="text-body-2 text-grey">
            Enter the name of a meal, drink, or category to find what you're
            looking for
          </p>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
