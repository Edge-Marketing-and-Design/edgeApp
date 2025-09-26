// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  runtimeConfig: {
    public: {
      registrationCode: process.env.REGISTRATION_CODE,
      developmentMode: process.env.DEVELOPMENT_MODE === 'true',
    },
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon/favicon-96x96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-touch-icon.png' },
        { rel: 'manifest', href: '/favicon/site.webmanifest' },
      ],
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
      { path: '~/components/formSubtypes', global: true, prefix: 'edge-form-subtypes' },
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
