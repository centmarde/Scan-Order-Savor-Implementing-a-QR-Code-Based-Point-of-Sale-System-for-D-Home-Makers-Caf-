<script setup lang="ts">
import { computed } from "vue";
import type { OrderHistoryItem } from "@/stores/cashierData";

interface Props {
  modelValue: boolean;
  order: OrderHistoryItem | null;
  processing: boolean;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const handleConfirm = () => {
  emit("confirm");
};
</script>

<template>
  <v-dialog v-model="dialogModel" max-width="400">
    <v-card>
      <v-card-title class="text-h6">Confirm Completion</v-card-title>
      <v-card-text>
        Are you sure you want to mark Order #{{ order?.id }} (Table
        {{ order?.table_id }}) as completed?
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="dialogModel = false">Cancel</v-btn>
        <v-btn
          color="success"
          variant="flat"
          @click="handleConfirm"
          :loading="processing"
        >
          Confirm
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>