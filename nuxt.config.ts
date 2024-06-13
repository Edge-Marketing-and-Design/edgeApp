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
  modules: ['@vant/nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/color-mode', 'shadcn-nuxt'],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui',
  },
  colorMode: {
    classSuffix: '',
  },
  imports: {
    dirs: [
      'edge/composables/**',
    ],
  },
  components: {
    dirs: [
      { path: '~/components/formSubtypes', global: true, prefix: 'form-subtypes' },
      // { path: '~/edge/components/formSubtypes', global: true, prefix: 'form-subtypes' },
      { path: '~/edge/components', global: true, prefix: 'edge' },
      '~/components',
    ],
  },
  vite: {
    define: {
      'process.env.DEBUG': false,
    },
    server: {
      hmr: {
        port: 3000, // Make sure this port matches your Nuxt server port
        clientPort: 3000, // Ensure this matches your Nuxt server port as well
      },
    },
  },
  devtools: { enabled: false },
})
