import edgeFirebase from '@edgedev/firebase'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(edgeFirebase, {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    emulatorAuth: import.meta.env.VITE_FIREBASE_EMULATOR_AUTH,
    emulatorFirestore: import.meta.env.VITE_FIREBASE_EMULATOR_FIRESTORE,
    emulatorFunctions: import.meta.env.VITE_FIREBASE_EMULATOR_FUNCTIONS,
    emulatorStorage: import.meta.env.VITE_FIREBASE_EMULATOR_STORAGE,
  }, true, true)
})
