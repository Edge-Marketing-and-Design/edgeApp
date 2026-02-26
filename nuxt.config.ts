import { createCmsNuxtHooks } from './edge/routes/cms/nuxtHooks'

const cmsRouteHooks = {}
Object.assign(cmsRouteHooks, createCmsNuxtHooks()) // Comment out this line to disable CMS routes.

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
      meta: [
        {
          'http-equiv': 'Content-Security-Policy',
          'content': 'font-src \'self\' https://files.edgemarketingdesign.com https://use.typekit.net https://p.typekit.net https://fonts.gstatic.com data:;',
        },
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
      { path: '~/components' },

      // Namespaced wrappers — keep them, but lower priority is fine
      { path: '~/edge/components', global: true, prefix: 'edge' },
      { path: '~/components/formSubtypes', global: true, prefix: 'edge-form-subtypes' },
    ],
  },
  vite: {
    define: {
      'process.env.DEBUG': false,
    },
    server: {
      watch: {
        ignored: ['**/.nuxt/**', '**/.output/**', '**/dist/**', '**/node_modules/**'],
      },
      hmr: {
        port: 3000, // Make sure this port matches your Nuxt server port
        clientPort: 3000, // Ensure this matches your Nuxt server port as well
      },
    },
  },
  hooks: cmsRouteHooks,
  devtools: { enabled: false },
})
