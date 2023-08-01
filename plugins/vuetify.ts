export default defineNuxtPlugin (async (nuxtApp) => {
  const { createVuetify } = await import('vuetify')
  const components = await import('vuetify/components')
  const directives = await import('vuetify/directives')
  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'light',
    },
    components,
    directives,
  })

  nuxtApp.vueApp.use(vuetify)
})
