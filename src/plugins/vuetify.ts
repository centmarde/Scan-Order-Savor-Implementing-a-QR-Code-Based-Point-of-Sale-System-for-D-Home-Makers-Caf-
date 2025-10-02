/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from "vuetify";

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Create vuetify instance with minimal configuration
// Theme is handled by themeController.ts → base.ts → UI components flow
const vuetify = createVuetify({
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        dark: false,
        colors: {
          // Minimal colors - actual theming handled by themeController
          primary: "#000000",
          secondary: "#666666",
        },
      },
    },
  },
});

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default vuetify;
