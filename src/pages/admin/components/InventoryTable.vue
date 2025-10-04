<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useTheme } from "@/composables/useTheme";
import {
  useInventoryDataStore,
  type InventoryItem,
} from "@/stores/inventoryData";
import AddItemDialog from "./dialogs/AddItemDialog.vue";
import EditItemDialog from "./dialogs/EditItemDialog.vue";
import DeleteItemDialog from "./dialogs/DeleteItemDialog.vue";

// Theme setup
const { primaryColor } = useTheme();

// Store
const inventoryStore = useInventoryDataStore();

// Reactive data
const search = ref("");
const dialog = ref(false);
const editDialog = ref(false);
const deleteDialog = ref(false);
const selectedItem = ref<InventoryItem | null>(null);

// Table headers
const headers = [
  { title: "ID", key: "id", sortable: true },
  { title: "Image", key: "image", sortable: false },
  { title: "Name", key: "name", sortable: true },
  { title: "Description", key: "description", sortable: false },
  { title: "Category", key: "category", sortable: true },
  { title: "Price", key: "price", sortable: true },
  { title: "Quantity", key: "quantity", sortable: true },
  { title: "Sales", key: "sales", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
];

// Computed properties
const filteredItems = computed(() => {
  if (!search.value) return inventoryStore.inventoryItems;

  return inventoryStore.searchItems(search.value);
});

// Methods
const openAddDialog = () => {
  dialog.value = true;
};

const openEditDialog = (item: InventoryItem) => {
  selectedItem.value = item;
  editDialog.value = true;
};

const openDeleteDialog = (item: InventoryItem) => {
  selectedItem.value = item;
  deleteDialog.value = true;
};

const handleItemAdded = async () => {
  // Store automatically refreshes after add/update/delete operations
};

const handleItemUpdated = async () => {
  // Store automatically refreshes after add/update/delete operations
};

const handleItemDeleted = async () => {
  // Store automatically refreshes after add/update/delete operations
};

const formatPrice = (price: number) => {
  return `₱${price.toFixed(2)}`;
};

// Lifecycle
onMounted(async () => {
  // Initialize inventory data if not already loaded
  if (inventoryStore.inventoryItems.length === 0) {
    await inventoryStore.fetchInventoryItems();
  }
});
</script>

<template>
  <v-card elevation="2" rounded="lg">
    <v-card-title class="d-flex align-center pa-4 pa-md-6">
      <v-icon :color="primaryColor" size="24" size-md="28" class="mr-2 mr-md-3">
        mdi-package-variant
      </v-icon>
      <span class="text-h6 text-md-h5 font-weight-bold">Inventory</span>
      <v-spacer />
      <v-btn
        :color="primaryColor"
        variant="flat"
        :prepend-icon="$vuetify.display.smAndUp ? 'mdi-plus' : ''"
        :icon="$vuetify.display.xs ? 'mdi-plus' : undefined"
        @click="openAddDialog"
        class="font-weight-bold"
        :size="$vuetify.display.xs ? 'small' : 'default'"
      >
        <span v-if="$vuetify.display.smAndUp" class="text-white">Add Item</span>
        <v-icon v-if="$vuetify.display.xs" color="white">mdi-plus</v-icon>
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-4 pa-md-6">
      <!-- Search Bar -->
      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search items..."
            variant="outlined"
            clearable
            hide-details
            density="compact"
          />
        </v-col>
      </v-row>

      <!-- Mobile Card View -->
      <div v-if="$vuetify.display.xs" class="mobile-cards">
        <v-card
          v-for="item in filteredItems"
          :key="item.id"
          class="mb-3 elevation-2"
          rounded="lg"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-start mb-3">
              <v-avatar size="50" class="mr-3">
                <v-img :src="item.image" :alt="item.name" cover>
                  <template #error>
                    <v-icon color="grey">mdi-image-off</v-icon>
                  </template>
                </v-img>
              </v-avatar>
              <div class="flex-grow-1">
                <h3 class="text-h6 font-weight-bold mb-1">{{ item.name }}</h3>
                <v-chip
                  size="x-small"
                  :color="primaryColor"
                  variant="tonal"
                  class="mb-2"
                >
                  {{ item.category }}
                </v-chip>
                <p class="text-body-2 text-medium-emphasis">
                  {{ item.description }}
                </p>
              </div>
            </div>

            <div class="d-flex justify-space-between align-center mb-3">
              <div class="text-center">
                <div class="text-caption text-medium-emphasis">Price</div>
                <div class="text-h6 font-weight-bold text-primary">
                  {{ formatPrice(item.price) }}
                </div>
              </div>
              <div class="text-center">
                <div class="text-caption text-medium-emphasis">Quantity</div>
                <v-chip
                  size="small"
                  :color="item.quantity > 0 ? 'success' : 'error'"
                  variant="tonal"
                >
                  {{ item.quantity }}
                </v-chip>
              </div>
              <div class="text-center">
                <div class="text-caption text-medium-emphasis">Sales</div>
                <div class="text-body-1 font-weight-bold text-success">
                  {{ item.sales || 0 }}
                </div>
              </div>
            </div>

            <div class="d-flex justify-end">
              <v-btn
                size="small"
                icon="mdi-pencil"
                variant="tonal"
                :color="primaryColor"
                @click="openEditDialog(item)"
                class="mr-2"
              />
              <v-btn
                size="small"
                icon="mdi-delete"
                variant="tonal"
                color="error"
                @click="openDeleteDialog(item)"
              />
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Desktop Table View -->
      <v-data-table
        v-else
        :headers="headers"
        :items="filteredItems"
        :loading="inventoryStore.loading"
        class="elevation-1"
        :items-per-page="10"
        :search="search"
      >
        <!-- Image Column -->
        <template #item.image="{ item }">
          <v-avatar size="40" class="my-2">
            <v-img :src="item.image" :alt="item.name" cover>
              <template #error>
                <v-icon color="grey">mdi-image-off</v-icon>
              </template>
            </v-img>
          </v-avatar>
        </template>

        <!-- Price Column -->
        <template #item.price="{ item }">
          <span class="font-weight-bold">{{ formatPrice(item.price) }}</span>
        </template>

        <!-- Category Column -->
        <template #item.category="{ item }">
          <v-chip
            size="small"
            :color="primaryColor"
            variant="tonal"
            class="font-weight-bold"
          >
            {{ item.category }}
          </v-chip>
        </template>

        <!-- Quantity Column -->
        <template #item.quantity="{ item }">
          <v-chip
            size="small"
            :color="item.quantity > 0 ? 'success' : 'error'"
            variant="tonal"
          >
            {{ item.quantity }}
          </v-chip>
        </template>

        <!-- Sales Column -->
        <template #item.sales="{ item }">
          <span class="font-weight-bold text-success">{{
            item.sales || 0
          }}</span>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <v-btn
            size="small"
            icon="mdi-pencil"
            variant="text"
            :color="primaryColor"
            @click="openEditDialog(item)"
            class="mr-1"
          />
          <v-btn
            size="small"
            icon="mdi-delete"
            variant="text"
            color="error"
            @click="openDeleteDialog(item)"
          />
        </template>

        <!-- Loading -->
        <template #loading>
          <v-skeleton-loader type="table-row@10" />
        </template>
      </v-data-table>

      <!-- Mobile Loading State -->
      <div
        v-if="inventoryStore.loading && $vuetify.display.xs"
        class="mobile-loading"
      >
        <v-skeleton-loader v-for="n in 5" :key="n" type="card" class="mb-3" />
      </div>
    </v-card-text>

    <!-- Dialog Components -->
    <AddItemDialog v-model="dialog" @item-added="handleItemAdded" />

    <EditItemDialog
      v-model="editDialog"
      :item="selectedItem"
      @item-updated="handleItemUpdated"
    />

    <DeleteItemDialog
      v-model="deleteDialog"
      :item="selectedItem"
      @item-deleted="handleItemDeleted"
    />
  </v-card>
</template>

<style scoped>
.mobile-cards {
  max-height: 70vh;
  overflow-y: auto;
}

.mobile-loading {
  padding: 16px 0;
}

/* Custom scrollbar for mobile cards */
.mobile-cards::-webkit-scrollbar {
  width: 4px;
}

.mobile-cards::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.mobile-cards::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.mobile-cards::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
