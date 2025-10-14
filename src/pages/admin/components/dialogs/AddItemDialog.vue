<script setup lang="ts">
import { ref, computed } from "vue";
import { useTheme } from "@/composables/useTheme";
import { useToast } from "vue-toastification";
import {
  useInventoryDataStore,
  type InventoryItem,
} from "@/stores/inventoryData";
import { MENU_ITEM_CATEGORIES } from "@/utils/constants";

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

// Toast
const toast = useToast();

// Store
const inventoryStore = useInventoryDataStore();

// Reactive data
const imageFile = ref<File | null>(null);
const imagePreview = ref<string>("");

// Form data for new item
const formData = ref<Omit<InventoryItem, "id" | "created_at">>({
  name: "",
  description: "",
  price: 0,
  category: "",
  image: "",
  quantity: 0,
  sales: 0,
});

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
  imageFile.value = null;
  imagePreview.value = "";
};

const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    imageFile.value = file;

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const closeDialog = () => {
  dialog.value = false;
  resetForm();
};

const saveItem = async () => {
  try {
    await inventoryStore.addInventoryItem(formData.value, imageFile.value);

    closeDialog();
    emit("item-added");
    toast.success("Item added successfully!");
  } catch (error) {
    console.error("Error in saveItem:", error);
    toast.error(
      `Error adding item: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
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
                :items="MENU_ITEM_CATEGORIES"
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
            <v-col cols="12">
              <div class="d-flex flex-column">
                <v-file-input
                  @change="handleImageSelect"
                  label="Select Image"
                  variant="outlined"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  prepend-icon="mdi-camera"
                  show-size
                  :clearable="true"
                  hint="Select an image file (JPEG, PNG, WebP) - Max 5MB"
                  persistent-hint
                  class="mb-4"
                />

                <!-- Image Preview -->
                <div v-if="imagePreview" class="mb-4">
                  <v-card class="mx-auto" max-width="200" elevation="2">
                    <v-img
                      :src="imagePreview"
                      height="150"
                      cover
                      class="text-white"
                    >
                      <template #placeholder>
                        <div
                          class="d-flex align-center justify-center fill-height"
                        >
                          <v-progress-circular
                            color="grey-lighten-4"
                            indeterminate
                          />
                        </div>
                      </template>
                    </v-img>
                    <v-card-subtitle class="text-center py-2">
                      Preview
                    </v-card-subtitle>
                  </v-card>
                </div>
              </div>
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
            :loading="inventoryStore.loading"
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
