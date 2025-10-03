<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useTheme } from "@/composables/useTheme";
import { supabase } from "@/lib/supabase";

// Interface for inventory items
interface InventoryItem {
  id?: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  quantity: number;
  sales: number;
  created_at?: string;
}

// Theme setup
const { primaryColor } = useTheme();

// Reactive data
const loading = ref(false);
const search = ref("");
const inventoryItems = ref<InventoryItem[]>([]);
const dialog = ref(false);
const editDialog = ref(false);
const deleteDialog = ref(false);
const selectedItem = ref<InventoryItem | null>(null);

// Form data for new/edit item
const formData = ref<InventoryItem>({
  name: "",
  description: "",
  price: 0,
  category: "",
  image: "",
  quantity: 0,
  sales: 0,
});

// Categories for the select dropdown
const categories = [
  "Main Dish",
  "Soup",
  "Vegetable Dish",
  "Appetizer",
  "Dessert",
  "Beverage",
];

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
  if (!search.value) return inventoryItems.value;

  return inventoryItems.value.filter(
    (item) =>
      item.name.toLowerCase().includes(search.value.toLowerCase()) ||
      item.description.toLowerCase().includes(search.value.toLowerCase()) ||
      item.category.toLowerCase().includes(search.value.toLowerCase())
  );
});

// Methods
const fetchInventoryItems = async () => {
  try {
    loading.value = true;
    const { data, error } = await supabase
      .from("menu")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching inventory items:", error);
      return;
    }

    inventoryItems.value = data || [];
  } catch (error) {
    console.error("Error in fetchInventoryItems:", error);
  } finally {
    loading.value = false;
  }
};

const openAddDialog = () => {
  formData.value = {
    name: "",
    description: "",
    price: 0,
    category: "",
    image: "",
    quantity: 0,
    sales: 0,
  };
  dialog.value = true;
};

const openEditDialog = (item: InventoryItem) => {
  selectedItem.value = item;
  formData.value = { ...item };
  editDialog.value = true;
};

const openDeleteDialog = (item: InventoryItem) => {
  selectedItem.value = item;
  deleteDialog.value = true;
};

const saveItem = async () => {
  try {
    loading.value = true;

    const { error } = await supabase.from("menu").insert([formData.value]);

    if (error) {
      console.error("Error adding item:", error);
      alert("Error adding item: " + error.message);
      return;
    }

    dialog.value = false;
    await fetchInventoryItems();
    alert("Item added successfully!");
  } catch (error) {
    console.error("Error in saveItem:", error);
    alert("Error adding item");
  } finally {
    loading.value = false;
  }
};

const updateItem = async () => {
  try {
    if (!selectedItem.value?.id) return;

    loading.value = true;

    const { error } = await supabase
      .from("menu")
      .update(formData.value)
      .eq("id", selectedItem.value.id);

    if (error) {
      console.error("Error updating item:", error);
      alert("Error updating item: " + error.message);
      return;
    }

    editDialog.value = false;
    await fetchInventoryItems();
    alert("Item updated successfully!");
  } catch (error) {
    console.error("Error in updateItem:", error);
    alert("Error updating item");
  } finally {
    loading.value = false;
  }
};

const deleteItem = async () => {
  try {
    if (!selectedItem.value?.id) return;

    loading.value = true;

    const { error } = await supabase
      .from("menu")
      .delete()
      .eq("id", selectedItem.value.id);

    if (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item: " + error.message);
      return;
    }

    deleteDialog.value = false;
    await fetchInventoryItems();
    alert("Item deleted successfully!");
  } catch (error) {
    console.error("Error in deleteItem:", error);
    alert("Error deleting item");
  } finally {
    loading.value = false;
  }
};

const formatPrice = (price: number) => {
  return `₱${price.toFixed(2)}`;
};

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  return `https://gsknjidllnenmauutahp.supabase.co/storage/v1/object/public/inventory/${imagePath}`;
};

// Lifecycle
onMounted(() => {
  fetchInventoryItems();
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
                <v-img :src="getImageUrl(item.image)" :alt="item.name" cover>
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
        :loading="loading"
        class="elevation-1"
        :items-per-page="10"
        :search="search"
      >
        <!-- Image Column -->
        <template #item.image="{ item }">
          <v-avatar size="40" class="my-2">
            <v-img :src="getImageUrl(item.image)" :alt="item.name" cover>
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
      <div v-if="loading && $vuetify.display.xs" class="mobile-loading">
        <v-skeleton-loader v-for="n in 5" :key="n" type="card" class="mb-3" />
      </div>
    </v-card-text>

    <!-- Add Item Dialog -->
    <v-dialog
      v-model="dialog"
      :max-width="$vuetify.display.xs ? '95vw' : '600'"
      :fullscreen="$vuetify.display.xs"
      :transition="
        $vuetify.display.xs ? 'dialog-bottom-transition' : 'dialog-transition'
      "
    >
      <v-card>
        <v-card-title class="pa-4 pa-md-6">
          <span class="text-h6 text-md-h5 font-weight-bold">Add New Item</span>
          <v-spacer />
          <v-btn
            v-if="$vuetify.display.xs"
            icon="mdi-close"
            variant="text"
            @click="dialog = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4 pa-md-6">
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.name"
                  label="Item Name"
                  variant="outlined"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="formData.description"
                  label="Description"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.category"
                  :items="categories"
                  label="Category"
                  variant="outlined"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="formData.price"
                  label="Price (₱)"
                  variant="outlined"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="formData.quantity"
                  label="Quantity"
                  variant="outlined"
                  type="number"
                  min="0"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.image"
                  label="Image URL/Path"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 pa-md-6 pt-0">
          <v-spacer v-if="!$vuetify.display.xs" />
          <div :class="$vuetify.display.xs ? 'd-flex flex-column ga-2' : ''">
            <v-btn
              variant="text"
              @click="dialog = false"
              :block="$vuetify.display.xs"
            >
              Cancel
            </v-btn>
            <v-btn
              :color="primaryColor"
              variant="flat"
              @click="saveItem"
              :loading="loading"
              :block="$vuetify.display.xs"
            >
              Save
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Item Dialog -->
    <v-dialog
      v-model="editDialog"
      :max-width="$vuetify.display.xs ? '95vw' : '600'"
      :fullscreen="$vuetify.display.xs"
      :transition="
        $vuetify.display.xs ? 'dialog-bottom-transition' : 'dialog-transition'
      "
    >
      <v-card>
        <v-card-title class="pa-4 pa-md-6">
          <span class="text-h6 text-md-h5 font-weight-bold">Edit Item</span>
          <v-spacer />
          <v-btn
            v-if="$vuetify.display.xs"
            icon="mdi-close"
            variant="text"
            @click="editDialog = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4 pa-md-6">
          <v-form>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.name"
                  label="Item Name"
                  variant="outlined"
                  required
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="formData.description"
                  label="Description"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.category"
                  :items="categories"
                  label="Category"
                  variant="outlined"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="formData.price"
                  label="Price (₱)"
                  variant="outlined"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="formData.quantity"
                  label="Quantity"
                  variant="outlined"
                  type="number"
                  min="0"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.image"
                  label="Image URL/Path"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 pa-md-6 pt-0">
          <v-spacer v-if="!$vuetify.display.xs" />
          <div :class="$vuetify.display.xs ? 'd-flex flex-column ga-2' : ''">
            <v-btn
              variant="text"
              @click="editDialog = false"
              :block="$vuetify.display.xs"
            >
              Cancel
            </v-btn>
            <v-btn
              :color="primaryColor"
              variant="flat"
              @click="updateItem"
              :loading="loading"
              :block="$vuetify.display.xs"
            >
              Update
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      :max-width="$vuetify.display.xs ? '90vw' : '400'"
    >
      <v-card>
        <v-card-title class="pa-4 pa-md-6">
          <span class="text-h6 text-md-h5 font-weight-bold"
            >Confirm Delete</span
          >
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4 pa-md-6">
          <p>
            Are you sure you want to delete
            <strong>{{ selectedItem?.name }}</strong
            >?
          </p>
          <p class="text-error">This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions class="pa-4 pa-md-6 pt-0">
          <v-spacer v-if="!$vuetify.display.xs" />
          <div :class="$vuetify.display.xs ? 'd-flex flex-column ga-2' : ''">
            <v-btn
              variant="text"
              @click="deleteDialog = false"
              :block="$vuetify.display.xs"
            >
              Cancel
            </v-btn>
            <v-btn
              color="error"
              variant="flat"
              @click="deleteItem"
              :loading="loading"
              :block="$vuetify.display.xs"
            >
              Delete
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

/* Improve form field spacing on mobile */
@media (max-width: 600px) {
  .v-col {
    padding: 4px 12px !important;
  }

  .v-text-field,
  .v-select,
  .v-textarea {
    margin-bottom: 8px;
  }
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
