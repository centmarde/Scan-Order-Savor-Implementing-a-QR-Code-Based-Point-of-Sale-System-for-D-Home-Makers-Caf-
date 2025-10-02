/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import vuetify, { initializeDynamicThemes } from './vuetify'
import pinia from '../stores'
import router from '../router'
import toast from './toast'

// Types
import type { App } from 'vue'

export function registerPlugins (app: App) {
  app
    .use(vuetify)
    .use(router)
    .use(pinia)

  toast(app)

  // Initialize dynamic themes after vuetify is registered
  initializeDynamicThemes().catch(error => {
    console.error('Failed to initialize dynamic themes:', error)
  })
}
