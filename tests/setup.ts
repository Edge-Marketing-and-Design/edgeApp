import '@testing-library/jest-dom'

// Nuxt page meta helper isn't present in unit test runtime.
(globalThis as any).definePageMeta = () => {}
