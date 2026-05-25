<template>
  <footer class="bg-white border-t border-gray-200 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 class="text-lg font-bold text-primary-600 mb-3">NexaPay</h3>
          <p class="text-sm text-gray-500">
            Your all-in-one FinTech SuperApp for payments, transfers, and investments.
          </p>
        </div>
        <div>
          <h4 class="font-semibold text-gray-900 mb-3">Quick Links</h4>
          <ul class="space-y-2 text-sm text-gray-500">
            <li><NuxtLink to="/" class="hover:text-primary-600">Home</NuxtLink></li>
            <li><NuxtLink to="/dashboard" class="hover:text-primary-600">Dashboard</NuxtLink></li>
            <li><NuxtLink to="/wallet" class="hover:text-primary-600">Wallet</NuxtLink></li>
            <li><NuxtLink to="/investments" class="hover:text-primary-600">Investments</NuxtLink></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold text-gray-900 mb-3">Support</h4>
          <ul class="space-y-2 text-sm text-gray-500">
            <li><a href="mailto:support@nexapay.io" class="hover:text-primary-600">support@nexapay.io</a></li>
            <li><span>Terms of Service</span></li>
            <li><span>Privacy Policy</span></li>
          </ul>
        </div>
      </div>
      <div class="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-400">
        &copy; {{ year }} NexaPay. All rights reserved.
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
