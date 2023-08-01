import edgeFirebaseFramework from '@edgedev/firebase-framework/vuetifyplugin'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(edgeFirebaseFramework)
})
