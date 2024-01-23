// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css',
  ],
  ssr: false,
  build: {
    transpile: ['vuetify'],
  },
  runtimeConfig: {
    public: {
      registrationCode: process.env.REGISTRATION_CODE,
    },
  },
  modules: [
    '@vant/nuxt',
  ],
  components: {
    dirs: [
      { path: '~/components/formSubtypes', global: true, prefix: 'form-subtypes' },
      '~/components',
    ],
  },
  vite: {
    define: {
      'process.env.DEBUG': false,
    },
  },
  devtools: { enabled: false },
})
