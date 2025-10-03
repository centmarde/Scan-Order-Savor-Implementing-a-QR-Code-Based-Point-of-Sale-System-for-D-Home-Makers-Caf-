<script setup lang="ts">
import { ref, computed } from "vue";
import { useTheme } from "@/composables/useTheme";

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

// Rating descriptions
const getRatingText = (rating: number) => {
  switch (rating) {
    case 1:
      return "Needs Improvement";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Very Good";
    case 5:
      return "Excellent";
    default:
      return "";
  }
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
      <v-card-title class="text-center pa-6 pb-4">
        <div class="d-flex flex-column align-center">
          <v-avatar
            size="64"
            :style="{
              backgroundColor: primaryColor + '20',
              border: `2px solid ${primaryColor}`,
            }"
            class="mb-3"
          >
            <v-icon size="32" :style="{ color: primaryColor }">
              mdi-heart-outline
            </v-icon>
          </v-avatar>
          <h2 class="text-h5 font-weight-light" :style="{ color: '#5D4E37' }">
            We'd Love Your Thoughts
          </h2>
          <p class="text-body-2 mt-2 text-center" :style="{ color: '#8B7355' }">
            Your feedback helps us serve you better
          </p>
        </div>
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <!-- Food Rating -->
        <div class="mb-6">
          <h3
            class="text-subtitle-1 mb-3 font-weight-medium"
            :style="{ color: '#5D4E37' }"
          >
            How was the food?
          </h3>
          <div class="d-flex align-center justify-center mb-2">
            <v-rating
              v-model="foodRating"
              :color="primaryColor"
              size="large"
              hover
              class="mx-2"
            />
          </div>
          <p class="text-center text-caption" :style="{ color: '#8B7355' }">
            {{ getRatingText(foodRating) }}
          </p>
        </div>

        <!-- Service Rating -->
        <div class="mb-6">
          <h3
            class="text-subtitle-1 mb-3 font-weight-medium"
            :style="{ color: '#5D4E37' }"
          >
            How was our service?
          </h3>
          <div class="d-flex align-center justify-center mb-2">
            <v-rating
              v-model="serviceRating"
              :color="primaryColor"
              size="large"
              hover
              class="mx-2"
            />
          </div>
          <p class="text-center text-caption" :style="{ color: '#8B7355' }">
            {{ getRatingText(serviceRating) }}
          </p>
        </div>

        <!-- Comments -->
        <div class="mb-4">
          <h3
            class="text-subtitle-1 mb-3 font-weight-medium"
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
            rows="3"
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
      <v-card-actions class="px-6 pb-6 pt-2">
        <v-row no-gutters>
          <v-col cols="6" class="pr-2">
            <v-btn
              @click="closeModal"
              variant="outlined"
              size="large"
              rounded="pill"
              :style="{
                borderColor: '#8B7355',
                color: '#8B7355',
              }"
              block
              class="text-body-2 font-weight-medium"
              :disabled="submitting"
            >
              Maybe Later
            </v-btn>
          </v-col>
          <v-col cols="6" class="pl-2">
            <v-btn
              @click="submitFeedback"
              variant="flat"
              size="large"
              rounded="pill"
              :style="{ backgroundColor: primaryColor, color: 'white' }"
              :loading="submitting"
              :disabled="!canSubmit"
              block
              class="text-body-2 font-weight-medium"
              elevation="2"
            >
              <v-icon left size="small" class="mr-1">mdi-send</v-icon>
              Share Feedback
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
