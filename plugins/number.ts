import VueNumberInput from '@chenfengyuan/vue-number-input'
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('VueNumberInput', VueNumberInput)
})
