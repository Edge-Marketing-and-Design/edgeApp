import edgeFirebaseFramework from '../edgeFirebaseFramework/vuetifyplugin'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(edgeFirebaseFramework)
})
