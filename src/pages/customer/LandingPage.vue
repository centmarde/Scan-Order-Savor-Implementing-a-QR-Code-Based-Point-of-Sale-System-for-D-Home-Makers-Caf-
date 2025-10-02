<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Carousel state
const currentSlide = ref(0);

// Auto-advance carousel every 3 seconds
let intervalId: number | undefined;
onMounted(() => {
  intervalId = window.setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % carouselImages.length;
  }, 5000);
});
onUnmounted(() => {
  if (intervalId) window.clearInterval(intervalId);
});

// Carousel images

const supabaseBaseUrl =
  "https://gsknjidllnenmauutahp.supabase.co/storage/v1/object/public/inventory/";
const carouselImages = [
  {
    src: supabaseBaseUrl + "adobo.jpg",
    alt: "Adobo Food",
  },
  {
    src: supabaseBaseUrl + "sinigang.jpg",
    alt: "Delicious Meal 2",
  },
  {
    src: supabaseBaseUrl + "caldereta.png",
    alt: "Healthy Food 3",
  },
];

/**
 * Navigate to the menu page
 */
const navigateToMenu = () => {
  router.push("/customer/menu");
};
</script>

<template>
  <v-container class="pa-0 fill-height" fluid>
    <v-row justify="center" align="center" class="ma-0 pa-0 fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" class="pa-4">
        <div class="d-flex flex-column justify-space-between fill-height">
          <!-- Top section with carousel -->
          <div class="text-center mb-8">
            <v-carousel
              v-model="currentSlide"
              height="400"
              hide-delimiters
              show-arrows="hover"
              class="mb-6"
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
                  height="400"
                  class="mx-auto"
                  style="border-radius: 16px; max-width: 400px"
                  cover
                />
              </v-carousel-item>
            </v-carousel>

            <!-- Carousel indicators -->
            <div class="d-flex justify-center align-center mb-6">
              <v-chip
                v-for="(image, index) in carouselImages"
                :key="index"
                :color="currentSlide === index ? 'pink' : 'grey-lighten-3'"
                size="x-small"
                variant="flat"
                class="mx-1"
                style="
                  width: 8px;
                  height: 8px;
                  min-width: 8px;
                  border-radius: 50%;
                "
                @click="currentSlide = index"
              ></v-chip>
            </div>
          </div>

          <!-- Middle section with text -->
          <div class="text-center mb-auto">
            <div
              class="text-caption text-grey-darken-1 mb-4 font-weight-medium"
            >
              30K+ FOOD ITEMS HERE
            </div>

            <h1 class="text-h3 font-weight-bold mb-2 text-grey-darken-4">
              Enjoy Healthy
            </h1>
            <h1 class="text-h3 font-weight-bold mb-8" style="color: #e91e63">
              Food
            </h1>
          </div>

          <!-- Bottom section with button -->
          <div class="text-center">
            <v-btn
              @click="navigateToMenu"
              color="pink"
              size="x-large"
              rounded="xl"
              elevation="0"
              block
              class="text-white font-weight-bold text-capitalize"
              style="height: 56px"
            >
              Get Started
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>
