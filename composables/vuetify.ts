// DO NOT CHANGE THIS FILE
import { getCurrentInstance } from 'vue'

export function useVuetify() {
  const instance: any = getCurrentInstance()
  if (!instance) {
    throw new Error('useVuetify should be called in setup().')
  }
  return instance.proxy.$vuetify
}
