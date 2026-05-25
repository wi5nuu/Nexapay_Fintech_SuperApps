import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: true,
  devtools: { enabled: true },
  srcDir: 'src/',

  modules: [
    '@nuxtjs/apollo',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
  ],

  apollo: {
    autoImports: true,
    clients: {
      default: {
        httpEndpoint: process.env.GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql',
      },
    },
  },

  pinia: {
    storesDirs: ['./src/stores/**'],
  },

  tailwindcss: {
    cssPath: '~/styles/main.css',
    configPath: 'tailwind.config.js',
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:3000/api',
      wsUrl: process.env.WS_URL ?? 'ws://localhost:3000',
    },
  },

  app: {
    head: {
      title: 'NexaPay - FinTech SuperApp',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'NexaPay FinTech SuperApp - Customer Portal' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },
})
