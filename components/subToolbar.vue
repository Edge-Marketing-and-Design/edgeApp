<script setup>
const el = ref(null)
</script>

<template>
  <div ref="el" class="van-safe-area-top">
    <div class="flex px-4">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>
