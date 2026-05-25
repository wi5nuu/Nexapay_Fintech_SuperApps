<template>
  <div class="flex flex-col min-h-screen bg-surface-50">
    <AppHeader />
    <main class="flex-1">
      <NuxtPage />
    </main>
    <AppFooter />
    <ClientOnly>
      <div v-if="showScrollTop" class="fixed bottom-6 right-6 z-50">
        <button
          class="w-10 h-10 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors"
          @click="scrollToTop"
          aria-label="Scroll to top"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const showScrollTop = ref(false)

function handleScroll(): void {
  showScrollTop.value = window.scrollY > 300
}

function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>
