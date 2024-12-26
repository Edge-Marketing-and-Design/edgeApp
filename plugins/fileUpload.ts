import VueUploadComponent from 'vue-upload-component'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('file-upload', VueUploadComponent)
})
