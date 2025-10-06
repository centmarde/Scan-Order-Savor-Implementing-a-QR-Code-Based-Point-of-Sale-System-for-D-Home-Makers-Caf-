<template>
  <v-row class="mt-4 mt-md-6">
    <v-col cols="12">
      <v-card elevation="4" class="pa-3 pa-md-4">
        <v-card-title
          :class="$vuetify.display.xs ? 'text-h6 mb-3' : 'text-h5 mb-4'"
        >
          <v-icon :class="$vuetify.display.xs ? 'mr-1' : 'mr-2'"
            >mdi-star</v-icon
          >
          Best Sellers
        </v-card-title>

        <v-row
          v-if="bestSellers.length > 0"
          class="justify-center justify-md-start"
        >
          <v-col
            v-for="item in bestSellers"
            :key="item.id"
            cols="12"
            sm="6"
            md="4"
            xl="3"
            class="d-flex"
          >
            <v-card elevation="2" class="flex-grow-1 d-flex flex-column">
              <v-img
                :src="getImageUrl(item.image)"
                :height="$vuetify.display.xs ? '140' : '120'"
                cover
                class="text-white"
              >
                <template #placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular
                      color="grey-lighten-4"
                      indeterminate
                      :size="$vuetify.display.xs ? '32' : '40'"
                    />
                  </div>
                </template>
                <div class="d-flex justify-end pa-2">
                  <v-chip
                    color="success"
                    :size="$vuetify.display.xs ? 'x-small' : 'small'"
                    prepend-icon="mdi-fire"
                  >
                    {{ item.sales }}
                  </v-chip>
                </div>
              </v-img>

              <v-card-text
                :class="$vuetify.display.xs ? 'pa-2' : 'pa-3'"
                class="flex-grow-1 d-flex flex-column"
              >
                <div
                  :class="
                    $vuetify.display.xs
                      ? 'text-body-2 font-weight-bold mb-1'
                      : 'text-subtitle-2 font-weight-bold mb-1'
                  "
                >
                  {{ item.name }}
                </div>
                <div class="text-caption text-medium-emphasis mb-2">
                  {{ item.category }}
                </div>
                <div class="mt-auto">
                  <div
                    :class="
                      $vuetify.display.xs
                        ? 'text-subtitle-1 font-weight-bold text-primary'
                        : 'text-h6 font-weight-bold text-primary'
                    "
                  >
                    {{ formatCurrency(item.price) }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <div
          v-else-if="loading"
          :class="$vuetify.display.xs ? 'text-center py-6' : 'text-center py-8'"
        >
          <v-progress-circular
            indeterminate
            color="primary"
            :size="$vuetify.display.xs ? '48' : '64'"
          />
          <div
            :class="
              $vuetify.display.xs ? 'text-body-2 mt-3' : 'text-body-1 mt-4'
            "
          >
            Loading best sellers...
          </div>
        </div>

        <div
          v-else
          :class="$vuetify.display.xs ? 'text-center py-6' : 'text-center py-8'"
        >
          <v-icon
            :size="$vuetify.display.xs ? '48' : '64'"
            color="grey-lighten-2"
          >
            mdi-food-off
          </v-icon>
          <div
            :class="
              $vuetify.display.xs
                ? 'text-body-2 text-medium-emphasis mt-3'
                : 'text-body-1 text-medium-emphasis mt-4'
            "
          >
            No menu items found
          </div>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useMenuDataStore } from "@/stores/menuData";
import { getImageUrl, formatCurrency } from "@/utils/helpers";
import type { MenuItem } from "@/stores/menuData";

// Props
interface Props {
  loading?: boolean;
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  limit: 3,
});

// Store
const menuDataStore = useMenuDataStore();

// Computed properties
const bestSellers = computed((): MenuItem[] => {
  return menuDataStore.getBestSellerItems(props.limit);
});
</script>

<style scoped>
/* Best seller card styling */
.best-seller-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.best-seller-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .best-sellers-grid .v-col {
    padding: 8px !important;
  }

  .best-seller-card {
    min-height: 200px;
  }
}

@media (min-width: 961px) {
  .best-sellers-grid {
    justify-content: flex-start;
  }
}

/* Loading and empty states */
.loading-state,
.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@media (max-width: 600px) {
  .loading-state,
  .empty-state {
    min-height: 150px;
  }
}
</style>
