<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { getInventoryImageUrl } from "@/utils/constants";
import { useTheme } from "@/composables/useTheme";
import { useTableContext } from "@/pages/admin/composables/useTableContext"; 

const router = useRouter();

// Theme setup
const { initializeTheme, primaryColor, secondaryColor } = useTheme();

// Carousel state
const currentSlide = ref(0);

// Table context - captures table ID from URL
const { tableId, initializeTable } = useTableContext();

// Auto-advance carousel every 3 seconds
let intervalId: number | undefined;
onMounted(async () => {
  // Initialize theme first
  await initializeTheme();
  
  // Initialize table from URL query parameter
  initializeTable(); // ← Captures table from URL

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
      <v-col cols="12" sm="8" md="6" lg="4" class="pa-4">
        <!-- Table ID Chip: Visible if tableId is set -->
        <div v-if="tableId" class="text-center">
          <v-chip color="primary" class="mb-4">
            <v-icon start>mdi-table-furniture</v-icon>
            Table {{ tableId }}
          </v-chip>
        </div>

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
              class="text-caption text-grey-darken-1 mb-4 font-weight-medium"
            >
              30K+ FOOD ITEMS HERE
            </div>

            <h1
              class="text-h3 font-weight-bold mb-2"
              :style="{ color: primaryColor }"
            >
              Enjoy Healthy
            </h1>
            <h1
              class="text-h3 font-weight-bold mb-8"
              :style="{ color: secondaryColor }"
            >
              Food
            </h1>
          </div>

          <!-- Bottom section with button -->
          <div class="text-center">
            <v-btn
              @click="navigateToMenu"
              size="x-large"
              rounded="xl"
              elevation="0"
              block
              class="text-white font-weight-bold text-capitalize mb-4"
              :style="{
                backgroundColor: primaryColor,
                height: '56px',
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