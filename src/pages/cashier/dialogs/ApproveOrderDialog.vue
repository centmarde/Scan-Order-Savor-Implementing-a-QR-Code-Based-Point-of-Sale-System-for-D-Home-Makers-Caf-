<script setup lang="ts">
import { computed } from "vue";
import type { OrderWithMeals } from "@/stores/orderData";

interface Props {
  modelValue: boolean;
  order: OrderWithMeals | null;
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
      <v-card-title>Approve Order?</v-card-title>
      <v-card-text>
        Are you sure you want to approve Order #{{ order?.id }} for
        Table {{ order?.table_id }}? This will send the order to the
        kitchen.
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
          Approve
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>