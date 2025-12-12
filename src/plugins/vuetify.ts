/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
import { VDateInput } from 'vuetify/labs/VDateInput'

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Import dynamic theme creation functions
import { createDynamicThemes } from '@/themes/base'

// Create vuetify instance with minimal initial configuration
// Themes will be loaded dynamically from external-page.json via base.ts
const vuetify = createVuetify({
  components: {
    VDateInput,
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      // Minimal fallback themes - will be replaced by dynamic loading
      light: {
        dark: false,
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#2196F3',
          secondary: '#616161',
        },
      },
    },
  },
})

// Function to initialize dynamic themes
export async function initializeDynamicThemes() {
  try {
    const themes = await createDynamicThemes()

    // Update vuetify themes with dynamic configuration
    vuetify.theme.themes.value.light = themes.light
    vuetify.theme.themes.value.dark = themes.dark

    console.log('Dynamic themes loaded successfully from external-page.json')
  } catch (error) {
    console.error('Failed to load dynamic themes:', error)
    console.warn('Using fallback themes')
  }
}

// Export vuetify instance for dynamic theme updates
export { vuetify }

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default vuetify
