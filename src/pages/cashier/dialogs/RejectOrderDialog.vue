<script setup lang="ts">
import { computed } from "vue";
import type { OrderWithMeals } from "@/stores/orderData";

interface Props {
  modelValue: boolean;
  order: OrderWithMeals | null;
  processing: boolean;
  reason: string;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "update:reason", value: string): void;
  (e: "confirm"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const reasonModel = computed({
  get: () => props.reason,
  set: (value) => emit("update:reason", value),
});

const handleConfirm = () => {
  emit("confirm");
};
</script>

<template>
  <v-dialog v-model="dialogModel" max-width="400">
    <v-card>
      <v-card-title>Reject Order?</v-card-title>
      <v-card-text>
        <p class="mb-4">
          Are you sure you want to reject Order #{{ order?.id }} for
          Table {{ order?.table_id }}?
        </p>
        <v-textarea
          v-model="reasonModel"
          label="Reason for rejection (optional)"
          rows="3"
          variant="outlined"
          hide-details
        ></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="dialogModel = false">Cancel</v-btn>
        <v-btn
          color="error"
          variant="flat"
          @click="handleConfirm"
          :loading="processing"
        >
          Reject
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>