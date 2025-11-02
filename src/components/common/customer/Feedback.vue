<script setup lang="ts">
import { ref, computed } from "vue";
import { useTheme } from "@/composables/useTheme";
import { getRatingText } from "@/utils/helpers";

// Props
interface Props {
  modelValue: boolean;
  orderIds: number[];
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "submit-feedback": [feedback: FeedbackData];
}>();

// Theme setup
const { primaryColor, secondaryColor } = useTheme();

// Feedback data interface
interface FeedbackData {
  orderIds: number[];
  foodRating: number;
  serviceRating: number;
  comments: string;
}

// Reactive data
const foodRating = ref(5);
const serviceRating = ref(5);
const comments = ref("");
const submitting = ref(false);

// Computed properties
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const canSubmit = computed(() => {
  return foodRating.value > 0 && serviceRating.value > 0;
});

// Methods
const submitFeedback = async () => {
  if (!canSubmit.value) return;

  submitting.value = true;

  try {
    const feedbackData: FeedbackData = {
      orderIds: props.orderIds,
      foodRating: foodRating.value,
      serviceRating: serviceRating.value,
      comments: comments.value.trim(),
    };

    emit("submit-feedback", feedbackData);

    // Reset form
    resetForm();
    isOpen.value = false;
  } catch (error) {
    console.error("Error submitting feedback:", error);
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  foodRating.value = 5;
  serviceRating.value = 5;
  comments.value = "";
};

const closeModal = () => {
  resetForm();
  isOpen.value = false;
};
</script>

<template>
  <v-dialog v-model="isOpen" max-width="480" persistent class="feedback-modal">
    <v-card
      rounded="xl"
      elevation="8"
      class="pa-2"
      :style="{ backgroundColor: '#f8f6f2' }"
    >
      <!-- Header -->
      <v-card-title class="text-center pa-4 pa-sm-6 pb-3 pb-sm-4">
        <div class="d-flex flex-column align-center">
          <v-avatar
            :size="$vuetify.display.xs ? 48 : 64"
            :style="{
              backgroundColor: primaryColor + '20',
              border: `2px solid ${primaryColor}`,
            }"
            class="mb-2 mb-sm-3"
          >
            <v-icon
              :size="$vuetify.display.xs ? 24 : 32"
              :style="{ color: primaryColor }"
            >
              mdi-heart-outline
            </v-icon>
          </v-avatar>
          <h2
            class="text-h6 text-sm-h5 font-weight-light"
            :style="{ color: '#5D4E37' }"
          >
            We'd Love Your Thoughts
          </h2>
          <p
            class="text-caption text-sm-body-2 mt-1 mt-sm-2 text-center"
            :style="{ color: '#8B7355' }"
          >
            Your feedback helps us serve you better
          </p>
        </div>
      </v-card-title>

      <v-card-text class="px-4 px-sm-6 pb-2">
        <!-- Food Rating -->
        <div class="mb-4 mb-sm-6">
          <h3
            class="text-body-2 text-sm-subtitle-1 mb-2 mb-sm-3 font-weight-medium"
            :style="{ color: '#5D4E37' }"
          >
            How was the food?
          </h3>
          <div class="d-flex align-center justify-center mb-2">
            <v-rating
              v-model="foodRating"
              :color="primaryColor"
              :size="$vuetify.display.xs ? 'default' : 'large'"
              hover
              class="mx-1 mx-sm-2"
            />
          </div>
          <p class="text-center text-caption" :style="{ color: '#8B7355' }">
            {{ getRatingText(foodRating) }}
          </p>
        </div>

        <!-- Service Rating -->
        <div class="mb-4 mb-sm-6">
          <h3
            class="text-body-2 text-sm-subtitle-1 mb-2 mb-sm-3 font-weight-medium"
            :style="{ color: '#5D4E37' }"
          >
            How was our service?
          </h3>
          <div class="d-flex align-center justify-center mb-2">
            <v-rating
              v-model="serviceRating"
              :color="primaryColor"
              :size="$vuetify.display.xs ? 'default' : 'large'"
              hover
              class="mx-1 mx-sm-2"
            />
          </div>
          <p class="text-center text-caption" :style="{ color: '#8B7355' }">
            {{ getRatingText(serviceRating) }}
          </p>
        </div>

        <!-- Comments -->
        <div class="mb-3 mb-sm-4">
          <h3
            class="text-body-2 text-sm-subtitle-1 mb-2 mb-sm-3 font-weight-medium"
            :style="{ color: '#5D4E37' }"
          >
            Any additional thoughts?
            <span
              class="text-caption font-weight-regular"
              :style="{ color: '#8B7355' }"
            >
              (Optional)
            </span>
          </h3>
          <v-textarea
            v-model="comments"
            placeholder="Share your experience with us..."
            :rows="$vuetify.display.xs ? 2 : 3"
            variant="outlined"
            rounded="lg"
            :style="{
              '--v-field-border-color': primaryColor + '40',
              '--v-field-border-opacity': 0.6,
            }"
            class="custom-textarea"
            counter="200"
            maxlength="200"
            no-resize
          />
        </div>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="px-4 px-sm-6 pb-4 pb-sm-6 pt-2">
        <v-row no-gutters>
          <v-col cols="6" class="pr-1 pr-sm-2">
            <v-btn
              @click="closeModal"
              variant="outlined"
              :size="$vuetify.display.xs ? 'default' : 'large'"
              rounded="pill"
              :style="{
                borderColor: '#8B7355',
                color: '#8B7355',
              }"
              block
              class="text-caption text-sm-body-2 font-weight-medium"
              :disabled="submitting"
            >
              <span class="d-none d-sm-inline">Maybe Later</span>
              <span class="d-inline d-sm-none">Later</span>
            </v-btn>
          </v-col>
          <v-col cols="6" class="pl-1 pl-sm-2">
            <v-btn
              @click="submitFeedback"
              variant="flat"
              :size="$vuetify.display.xs ? 'default' : 'large'"
              rounded="pill"
              :style="{ backgroundColor: primaryColor, color: 'white' }"
              :loading="submitting"
              :disabled="!canSubmit"
              block
              class="text-caption text-sm-body-2 font-weight-medium"
              elevation="2"
            >
              <v-icon
                left
                :size="$vuetify.display.xs ? 'x-small' : 'small'"
                class="mr-1"
                >mdi-send</v-icon
              >
              <span class="d-none d-sm-inline">Share Feedback</span>
              <span class="d-inline d-sm-none">Submit</span>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
