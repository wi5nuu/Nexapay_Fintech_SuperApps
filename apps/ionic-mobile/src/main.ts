import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import { createPinia } from 'pinia'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import App from './App.vue'
import router from './router'

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'
import '@ionic/vue/css/ionic-swiper.css'

const app = createApp(App).use(IonicVue).use(createPinia()).use(router)

async function initializeApp() {
  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.setStyle({ style: Style.Light })
      await StatusBar.setBackgroundColor({ color: '#ffffff' })
    } catch {
      console.warn('StatusBar plugin not available')
    }
    try {
      await SplashScreen.hide()
    } catch {
      console.warn('SplashScreen plugin not available')
    }
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        console.warn('Service worker registration failed')
      })
    })
  }

  await app.mount('#app')
}

initializeApp()
