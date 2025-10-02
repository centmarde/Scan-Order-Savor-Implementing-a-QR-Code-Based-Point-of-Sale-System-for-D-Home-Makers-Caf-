<script setup lang="ts">
import { APP_CONFIG } from "@/utils/constants";
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

    <v-btn icon variant="text">
      <v-icon>mdi-magnify</v-icon>
    </v-btn>
  </v-app-bar>
</template>
