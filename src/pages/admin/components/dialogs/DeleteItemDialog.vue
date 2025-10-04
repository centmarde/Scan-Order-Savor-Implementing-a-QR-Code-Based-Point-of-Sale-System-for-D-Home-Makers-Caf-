<script setup lang="ts">
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import type { MenuItem } from "@/stores/menuData";

// Props
interface Props {
  modelValue: boolean;
  item: MenuItem | null;
}

// Emits
interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "item-deleted"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Reactive data
const loading = ref(false);

// Computed properties
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Methods
const closeDialog = () => {
  dialog.value = false;
};

const deleteItem = async () => {
  try {
    if (!props.item?.id) return;

    loading.value = true;

    const { error } = await supabase
      .from("menu")
      .delete()
      .eq("id", props.item.id);

    if (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item: " + error.message);
      return;
    }

    closeDialog();
    emit("item-deleted");
    alert("Item deleted successfully!");
  } catch (error) {
    console.error("Error in deleteItem:", error);
    alert("Error deleting item");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" :max-width="$vuetify.display.xs ? '90vw' : '400'">
    <v-card>
      <v-card-title class="pa-4 pa-md-6">
        <span class="text-h6 text-md-h5 font-weight-bold">Confirm Delete</span>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4 pa-md-6">
        <p>
          Are you sure you want to delete
          <strong>{{ item?.name }}</strong
          >?
        </p>
        <p class="text-error">This action cannot be undone.</p>
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
            color="error"
            variant="flat"
            @click="deleteItem"
            :loading="loading"
          >
            Delete
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
