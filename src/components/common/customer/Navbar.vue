<script setup lang="ts">
import { ref, withDefaults } from "vue";
import { APP_CONFIG } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";
import type { MenuItem } from "@/stores/menuData";
import SearchDialog from "./SearchDialog.vue";

// Props
interface Props {
  menuItems?: MenuItem[];
  pageTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  pageTitle: "Menu",
});

// Emits
const emit = defineEmits<{
  addToCart: [item: MenuItem];
}>();

// Reactive data
const searchDialog = ref(false);

// Theme colors
const { primaryColor, textPrimary } = useTheme();

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
    <v-btn
      icon
      variant="text"
      :style="{ color: primaryColor }"
      @click="$router.go(-1)"
    >
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>

    <v-spacer />

    <div class="text-center">
      <h2 class="text-h6 font-weight-bold" :style="{ color: primaryColor }">
        {{ APP_CONFIG.APP_NAME }}
      </h2>
      <p class="text-caption ma-0" :style="{ color: textPrimary }">
        {{ pageTitle }}
      </p>
    </div>

    <v-spacer />

    <v-btn
      icon
      variant="text"
      :style="{ color: primaryColor }"
      @click="openSearchModal"
    >
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
