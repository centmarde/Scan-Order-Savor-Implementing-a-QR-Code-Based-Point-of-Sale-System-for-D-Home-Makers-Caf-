<script setup lang="ts">
import { useTheme } from "@/composables/useTheme";
import { APP_CONFIG } from "@/utils/constants";
import type { MenuItem } from "@/stores/menuData";

// Props
interface Props {
  displayItems: { item: MenuItem; quantity: number }[];
  loadingOrders: boolean;
}

const props = defineProps<Props>();

// Theme setup
const { primaryColor } = useTheme();
</script>

<template>
  <!-- Order Items List -->
  <v-card
    class="mb-3"
    elevation="2"
    rounded="lg"
    :style="{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      border: '1px solid rgba(139, 92, 42, 0.1)',
    }"
  >
    <v-card-text class="pa-3">
      <h3
        class="text-subtitle-1 font-weight-bold mb-2"
        :style="{ color: '#2D2D2D' }"
      >
        Ordered Items
      </h3>

      <!-- Loading State -->
      <div v-if="loadingOrders" class="text-center py-4">
        <v-progress-circular
          indeterminate
          color="primary"
          size="24"
          class="mb-2"
        ></v-progress-circular>
        <p class="text-caption text-grey-darken-1">Loading your orders...</p>
      </div>

      <v-list v-else class="pa-0" style="background: transparent">
        <v-list-item
          v-for="groupedItem in displayItems"
          :key="groupedItem.item.id"
          class="px-0 py-2 mb-2"
          :style="{
            backgroundColor: '#ffffff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }"
        >
          <template v-slot:prepend>
            <div class="position-relative mr-3 ml-2">
              <v-avatar
                size="48"
                class="elevation-1"
                :style="{
                  border: '1px solid #ffffff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
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
                  top: '-3px',
                  right: '-3px',
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

          <v-list-item-content class="py-1">
            <v-list-item-title
              class="text-body-1 font-weight-bold mb-1"
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
              class="text-caption mb-1"
              :style="{ color: '#666' }"
            >
              {{
                groupedItem.item.description ||
                "Delicious meal prepared with care"
              }}
            </v-list-item-subtitle>

            <div class="d-flex align-center justify-space-between">
              <span
                class="text-caption font-weight-medium"
                :style="{ color: primaryColor }"
              >
                {{ APP_CONFIG.CURRENCY
                }}{{ groupedItem.item.price.toFixed(2) }} each
              </span>
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
