<script setup lang="ts">
import { onMounted } from "vue";
import InnerLayoutWrapper from "@/layouts/InnerLayoutWrapper.vue";
import InventoryTable from "@/pages/admin/components/InventoryTable.vue";
</script>
<template>
  <InnerLayoutWrapper>
    <template #content>
      <v-container fluid class="pa-6">
        <v-row>
          <v-col cols="12">
            <InventoryTable />
          </v-col>
        </v-row>
      </v-container>
    </template>
  </InnerLayoutWrapper>
</template>
