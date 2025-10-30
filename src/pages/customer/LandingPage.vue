<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { getInventoryImageUrl } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";

const router = useRouter();

// Theme setup
const { initializeTheme, primaryColor, secondaryColor } = useTheme();

// Carousel state
const currentSlide = ref(0);

// Auto-advance carousel every 3 seconds
let intervalId: number | undefined;
onMounted(async () => {
  // Initialize theme first
  await initializeTheme();

  intervalId = window.setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % carouselImages.length;
  }, 5000);
});
onUnmounted(() => {
  if (intervalId) window.clearInterval(intervalId);
});

// Carousel images
const carouselImages = [
  {
    src: getInventoryImageUrl("adobo.jpg"),
    alt: "Adobo Food",
  },
  {
    src: getInventoryImageUrl("sinigang.jpg"),
    alt: "Delicious Meal 2",
  },
  {
    src: getInventoryImageUrl("caldereta.png"),
    alt: "Healthy Food 3",
  },
];

/**
 * Navigate to the menu page
 */
const navigateToMenu = () => {
  router.push("/customer/menu");
};

/**
 * Navigate to employee access
 */
const navigateToEmployeeAccess = () => {
  router.push("/hero");
};
</script>

<template>
  <v-container class="pa-0 fill-height" fluid>
    <v-row justify="center" align="center" class="ma-0 pa-0 fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" class="pa-3 pa-sm-4">
        <div class="d-flex flex-column justify-space-between fill-height">
          <!-- Top section with carousel -->
          <div class="text-center mb-4 mb-sm-8">
            <v-carousel
              v-model="currentSlide"
              :height="$vuetify.display.xs ? 350 : 400"
              hide-delimiters
              show-arrows="hover"
              class="mb-4 mb-sm-6"
              touch
              transition="fade-transition"
            >
              <v-carousel-item
                v-for="(image, index) in carouselImages"
                :key="index"
              >
                <v-img
                  :src="image.src"
                  :alt="image.alt"
                  :height="$vuetify.display.xs ? 350 : 400"
                  class="mx-auto"
                  :style="{
                    borderRadius: '16px',
                    maxWidth: $vuetify.display.xs ? '100%' : '400px',
                  }"
                  cover
                />
              </v-carousel-item>
            </v-carousel>

            <!-- Carousel indicators -->
            <div class="d-flex justify-center align-center mb-4 mb-sm-6">
              <v-chip
                v-for="(image, index) in carouselImages"
                :key="index"
                :style="{
                  backgroundColor:
                    currentSlide === index ? primaryColor : secondaryColor,
                  width: '8px',
                  height: '8px',
                  minWidth: '8px',
                  borderRadius: '50%',
                }"
                size="x-small"
                variant="flat"
                class="mx-1"
                @click="currentSlide = index"
              ></v-chip>
            </div>
          </div>

          <!-- Middle section with text -->
          <div class="text-center mb-auto">
            <div
              class="text-caption text-grey-darken-1 mb-2 mb-sm-4 font-weight-medium"
              :style="{ fontSize: $vuetify.display.xs ? '0.65rem' : '' }"
            >
              30K+ FOOD ITEMS HERE
            </div>

            <h1
              class="text-h4 text-sm-h3 font-weight-bold mb-1 mb-sm-2"
              :style="{ color: primaryColor }"
            >
              Enjoy Healthy
            </h1>
            <h1
              class="text-h4 text-sm-h3 font-weight-bold mb-4 mb-sm-8"
              :style="{ color: secondaryColor }"
            >
              Food
            </h1>
          </div>

          <!-- Bottom section with button -->
          <div class="text-center">
            <v-btn
              @click="navigateToMenu"
              :size="$vuetify.display.xs ? 'large' : 'x-large'"
              rounded="xl"
              elevation="0"
              block
              class="text-white font-weight-bold text-capitalize mb-3 mb-sm-4"
              :style="{
                backgroundColor: primaryColor,
                height: $vuetify.display.xs ? '48px' : '56px',
              }"
            >
              Get Started
            </v-btn>

            <!-- Employee Access Button -->
            <v-btn
              @click="navigateToEmployeeAccess"
              variant="text"
              size="small"
              class="text-caption font-weight-medium text-lowercase"
              :style="{ color: secondaryColor }"
            >
              Employee Access
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
