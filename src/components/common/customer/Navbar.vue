<script setup lang="ts">
import { ref } from "vue";
import { APP_CONFIG } from "@/utils/constants";
import SearchDialog from "./SearchDialog.vue";

// Props
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
  sales: number;
  category?: string;
  created_at: string;
}

interface Props {
  menuItems?: MenuItem[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  addToCart: [item: MenuItem];
}>();

// Reactive data
const searchDialog = ref(false);

// Methods
const openSearchModal = () => {
  searchDialog.value = true;
};

const addToCart = (item: MenuItem) => {
  emit("addToCart", item);
};
</script>

<template>
  <v-app-bar elevation="1" color="white" class="px-4 border-b-sm">
    <v-btn icon variant="text" @click="$router.go(-1)">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>

    <v-spacer />

    <div class="text-center">
      <h2 class="text-h6 font-weight-bold text-grey-darken-3">
        {{ APP_CONFIG.APP_NAME }}
      </h2>
      <p class="text-caption text-grey-darken-1 ma-0">Menu</p>
    </div>

    <v-spacer />

    <v-btn icon variant="text" @click="openSearchModal">
      <v-icon>mdi-magnify</v-icon>
    </v-btn>
  </v-app-bar>

  <!-- Search Dialog Component -->
  <SearchDialog
    v-model="searchDialog"
    :menu-items="menuItems"
    @add-to-cart="addToCart"
  />
</template>
