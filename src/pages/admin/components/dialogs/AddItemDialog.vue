<script setup lang="ts">
import { ref, computed } from "vue";
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

// Props
interface Props {
  modelValue: boolean;
}

// Emits
interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "item-added"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Theme setup
const { primaryColor } = useTheme();

// Reactive data
const loading = ref(false);

// Form data for new item
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

// Computed properties
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Methods
const resetForm = () => {
  formData.value = {
    name: "",
    description: "",
    price: 0,
    category: "",
    image: "",
    quantity: 0,
    sales: 0,
  };
};

const closeDialog = () => {
  dialog.value = false;
  resetForm();
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

    closeDialog();
    emit("item-added");
    alert("Item added successfully!");
  } catch (error) {
    console.error("Error in saveItem:", error);
    alert("Error adding item");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
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
          @click="closeDialog"
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
        <div
          class="d-flex w-100"
          :class="$vuetify.display.xs ? 'justify-space-between' : 'justify-end'"
        >
          <v-btn
            variant="text"
            @click="closeDialog"
            :class="$vuetify.display.xs ? '' : 'mr-2'"
          >
            Cancel
          </v-btn>
          <v-btn
            :color="primaryColor"
            variant="flat"
            @click="saveItem"
            :loading="loading"
          >
            Save
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
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
</style>
