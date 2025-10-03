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
    <v-card-title class="d-flex align-center pa-6">
      <v-icon :color="primaryColor" size="28" class="mr-3">
        mdi-package-variant
      </v-icon>
      <span class="text-h5 font-weight-bold">Inventory Management</span>
      <v-spacer />
      <v-btn
        :color="primaryColor"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="openAddDialog"
        class="font-weight-bold"
      >
        Add Item
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-6">
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
          />
        </v-col>
      </v-row>

      <!-- Data Table -->
      <v-data-table
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
    </v-card-text>

    <!-- Add Item Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title class="pa-6">
          <span class="text-h5 font-weight-bold">Add New Item</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
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
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false"> Cancel </v-btn>
          <v-btn
            :color="primaryColor"
            variant="flat"
            @click="saveItem"
            :loading="loading"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Item Dialog -->
    <v-dialog v-model="editDialog" max-width="600">
      <v-card>
        <v-card-title class="pa-6">
          <span class="text-h5 font-weight-bold">Edit Item</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
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
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false"> Cancel </v-btn>
          <v-btn
            :color="primaryColor"
            variant="flat"
            @click="updateItem"
            :loading="loading"
          >
            Update
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="pa-6">
          <span class="text-h5 font-weight-bold">Confirm Delete</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6">
          <p>
            Are you sure you want to delete
            <strong>{{ selectedItem?.name }}</strong
            >?
          </p>
          <p class="text-error">This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false"> Cancel </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="deleteItem"
            :loading="loading"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
/* Add any custom styles here */
</style>
