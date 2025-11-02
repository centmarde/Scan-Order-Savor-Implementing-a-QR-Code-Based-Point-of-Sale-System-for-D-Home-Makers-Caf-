<script setup lang="ts">
import { useAuthUserStore } from "@/stores/authUser";
import InnerLayoutWrapper from "@/layouts/InnerLayoutWrapper.vue";
import Dashboard from "@/pages/admin/components/Dashboard.vue";

const authStore = useAuthUserStore();

// Reactive references from the auth store
const { userName } = storeToRefs(authStore);
</script>

<template>
  <InnerLayoutWrapper>
    <template #content>
      <v-container fluid class="home-container">
        <!-- Welcome Section -->
        <!-- <v-row justify="center" class="welcome-section">
          <v-col cols="12" md="8" lg="6">
            <v-card elevation="4" class="pa-6">
              <v-card-title class="text-h4 text-center mb-4">
                Welcome Home!
              </v-card-title>

              <v-card-text class="text-center">
                <v-avatar size="80" class="mb-4" color="primary">
                  <v-icon size="40" color="white">mdi-account-circle</v-icon>
                </v-avatar>

                <p class="text-h6 mb-2">Hello, {{ userName }}!</p>
                <p class="text-body-1 text-medium-emphasis mb-4">
                  You are successfully logged in.
                </p>

                <v-chip
                  color="success"
                  variant="tonal"
                  class="mb-4"
                  prepend-icon="mdi-check-circle"
                >
                  Authenticated
                </v-chip>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row> -->

        <!-- Dashboard Component -->
        <div class="dashboard-section">
          <Dashboard />
        </div>
      </v-container>
    </template>
  </InnerLayoutWrapper>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  padding-bottom: 20px;
}

.welcome-section {
  padding-top: 2rem;
  padding-bottom: 1rem;
}

.dashboard-section {
  flex: 1;
  padding-bottom: 2rem;
}

/* Ensure proper spacing on mobile */
@media (max-width: 600px) {
  .home-container {
    padding-left: 8px;
    padding-right: 8px;
  }

  .welcome-section {
    padding-top: 1rem;
    padding-bottom: 0.5rem;
  }

  .dashboard-section {
    padding-bottom: 1rem;
  }
}
</style>
