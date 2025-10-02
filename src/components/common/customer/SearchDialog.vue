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
  return props.menuItems.filter((item) =>
    item.name.toLowerCase().includes(query)
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

<style scoped>
.wood-brown-dark {
  color: #8b5c2a;
}
.wood-brown-light {
  color: #c19a6b;
}
.flex-grow-1 {
  flex-grow: 1;
}
.brown-category-chip {
  background-color: #c19a6b;
  color: #8b5c2a;
  border: 1px solid #8b5c2a;
}
.dark-wood-chip {
  background-color: #8b5c2a;
}
.light-brown-overlay {
  background-color: #c19a6b;
}
.dark-wood-btn {
  background-color: #8b5c2a;
  color: #fff;
}
.outlined-wood-btn {
  border-color: #c19a6b;
  color: #c19a6b;
}
</style>

<template>
  <!-- Search Modal -->
  <v-dialog v-model="isOpen" max-width="500">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center pa-4">
        <h3 class="text-h6 font-weight-bold wood-brown-dark flex-grow-1">
          Search Menu
        </h3>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" size="small" @click="closeDialog">
          <v-icon class="wood-brown-light">mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="px-4 pb-4">
        <!-- Search Input -->
        <v-text-field
          v-model="searchQuery"
          placeholder="Search for meal names..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          rounded="xl"
          clearable
          autofocus
          hide-details
          class="mb-4"
          color="#C19A6B"
        ></v-text-field>

        <!-- Search Results -->
        <div v-if="searchQuery.trim()">
          <!-- Results Found -->
          <div v-if="filteredSearchResults.length > 0">
            <p class="text-body-2 mb-3 wood-brown-dark">
              {{ filteredSearchResults.length }} result{{
                filteredSearchResults.length > 1 ? "s" : ""
              }}
              found
            </p>

            <div class="search-results overflow-auto" style="max-height: 400px">
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
                        class="text-body-1 font-weight-bold mb-1 wood-brown-dark"
                      >
                        {{ item.name }}
                      </h4>
                      <p class="text-caption mb-2 wood-brown-light">
                        {{ item.description }}
                      </p>

                      <!-- Category chip -->
                      <v-chip
                        v-if="item.category"
                        size="x-small"
                        variant="flat"
                        class="mb-2 brown-category-chip"
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
                          variant="flat"
                          class="text-white dark-wood-chip"
                        >
                          Only {{ item.quantity }} left
                        </v-chip>
                      </div>

                      <span
                        class="text-h6 font-weight-bold ml-2"
                        :class="
                          item.quantity === 0
                            ? 'wood-brown-light'
                            : 'wood-brown-dark'
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
                        ></v-img>
                        <v-overlay
                          v-if="item.quantity === 0"
                          contained
                          class="d-flex align-center justify-center rounded-lg light-brown-overlay"
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
                        variant="flat"
                        class="dark-wood-btn"
                      >
                        <v-icon size="18" class="wood-brown-light"
                          >mdi-plus</v-icon
                        >
                      </v-btn>
                      <v-btn
                        v-else
                        disabled
                        icon
                        size="small"
                        variant="outlined"
                        class="outlined-wood-btn"
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
            <v-icon size="64" class="mb-4 wood-brown-light">
              mdi-food-off
            </v-icon>
            <p class="text-h6 mb-2 wood-brown-dark">No Results Found</p>
            <p class="text-body-2 wood-brown-light">
              Try searching with different keywords
            </p>
          </div>
        </div>

        <!-- Search Prompt -->
        <div v-else class="text-center py-8">
          <v-icon size="64" class="mb-4 wood-brown-dark"> mdi-magnify </v-icon>
          <p class="text-h6 mb-2 wood-brown-dark">Search for Menu Items</p>
          <p class="text-body-2 wood-brown-light">
            Enter the name of a meal to find what you're looking for
          </p>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
