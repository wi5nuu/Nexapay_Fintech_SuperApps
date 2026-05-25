<template>
  <div class="min-h-screen">
    <section class="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 text-white overflow-hidden">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div class="text-center max-w-3xl mx-auto">
          <h1 class="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Your Complete Financial<br />
            <span class="text-primary-300">SuperApp</span>
          </h1>
          <p class="text-lg md:text-xl text-primary-100 mb-8 leading-relaxed">
            NexaPay brings together payments, wallets, investments, loans, and more — 
            all in one secure, intelligent platform. Experience the future of fintech.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink to="/register" class="btn-primary btn-lg px-8 py-3 bg-white text-primary-900 hover:bg-primary-50 font-semibold rounded-lg shadow-xl">
              Get Started Free
            </NuxtLink>
            <NuxtLink to="/login" class="btn-outline btn-lg px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-primary-900 font-semibold rounded-lg transition-all">
              Sign In
            </NuxtLink>
          </div>
          <div class="mt-12 flex items-center justify-center gap-8 text-sm text-primary-200">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              1M+ Users
            </span>
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              SOC 2 Certified
            </span>
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              24/7 Support
            </span>
          </div>
        </div>
      </div>
      <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface-50 to-transparent" />
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold text-surface-900 mb-4">Everything You Need in One Place</h2>
        <p class="text-lg text-surface-500 max-w-2xl mx-auto">
          From everyday payments to wealth building, NexaPay powers your entire financial life.
        </p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="card p-6 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
          </div>
          <h3 class="text-lg font-semibold text-surface-900 mb-2">E-Wallet</h3>
          <p class="text-surface-500 text-sm">Multi-currency wallet with instant P2P transfers, QRIS payments, and 24/7 top-up via virtual account or bank transfer.</p>
        </div>
        <div class="card p-6 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
          </div>
          <h3 class="text-lg font-semibold text-surface-900 mb-2">Investments</h3>
          <p class="text-surface-500 text-sm">Access curated mutual funds, bonds, and time deposits with real-time price feeds and portfolio tracking.</p>
        </div>
        <div class="card p-6 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 class="text-lg font-semibold text-surface-900 mb-2">Loans & Credit</h3>
          <p class="text-surface-500 text-sm">Smart loans with instant approval, competitive rates, and flexible repayment schedules tailored to your needs.</p>
        </div>
        <div class="card p-6 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <h3 class="text-lg font-semibold text-surface-900 mb-2">Secure KYC</h3>
          <p class="text-surface-500 text-sm">Fast and secure identity verification with AI-powered document OCR and liveness detection for compliance.</p>
        </div>
        <div class="card p-6 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h3 class="text-lg font-semibold text-surface-900 mb-2">Bank-Grade Security</h3>
          <p class="text-surface-500 text-sm">AES-256 encryption, biometric 2FA, real-time fraud detection, and SOC 2 compliance protect your assets.</p>
        </div>
        <div class="card p-6 hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
          </div>
          <h3 class="text-lg font-semibold text-surface-900 mb-2">24/7 Support</h3>
          <p class="text-surface-500 text-sm">Multi-channel support via in-app chat, email, and phone with AI-powered instant responses and human escalation.</p>
        </div>
      </div>
    </section>

    <section class="bg-primary-900 text-white py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Financial Life?</h2>
        <p class="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
          Join over 1 million users who trust NexaPay for their everyday financial needs.
          Get started in under 2 minutes.
        </p>
        <NuxtLink to="/register" class="inline-block bg-white text-primary-900 px-10 py-3 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-colors shadow-xl">
          Create Free Account
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'NexaPay — Your Complete Financial SuperApp',
  description: 'NexaPay brings together payments, wallets, investments, loans, and more in one secure platform. Join 1M+ users.',
  ogImage: '/og-image.png',
})
</script>
