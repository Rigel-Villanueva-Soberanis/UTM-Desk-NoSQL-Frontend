import './assets/main.css'
import '@fontsource-variable/inter'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'

import { localeEs } from './core/locale/primevue-es'
import App from './App.vue'
import router from './core/router'
import { aviso } from './core/http/avisos'

// Aura con el azul institucional como color principal (por defecto trae verde esmeralda).
const TemaUtm = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },
    // Botones y enlaces principales en el azul institucional más profundo (#1d4ed8), como en la maqueta.
    colorScheme: {
      light: {
        primary: { color: '{blue.700}', contrastColor: '#ffffff', hoverColor: '{blue.800}', activeColor: '{blue.900}' },
      },
    },
  },
})

const app = createApp(App)

// Último recurso: un error inesperado de un componente no debe dejar la pantalla "congelada" sin aviso.
app.config.errorHandler = (err, _instancia, info) => {
  console.error('[UTM Desk]', info, err)
  aviso('error', 'Algo salió mal', 'Ocurrió un error inesperado en la pantalla. Si persiste, recarga la página.')
}

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: { preset: TemaUtm, options: { darkModeSelector: '.app-dark' } },
  locale: localeEs,
})
app.use(ConfirmationService)

app.mount('#app')
