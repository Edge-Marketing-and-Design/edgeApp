<script setup>
const el = ref(null)
const edgeFirebase = inject('edgeFirebase')
const user = computed(() => {
  return edgeFirebase.user
})
watch (el, async () => {
  if (user.value.loggedIn) {
    globalState.secondHeaderHeight = el.value.$el.offsetHeight
  }
})
</script>

<template>
  <v-layout-item ref="el" model-value position="top" class="text-center van-safe-area-top" size="64">
    <v-toolbar flat class="px-4">
      <slot />
    </v-toolbar>
  </v-layout-item>
</template>

<style lang="scss" scoped>

</style>
