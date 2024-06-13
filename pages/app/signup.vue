<script setup>
const config = useRuntimeConfig()
</script>

<template>
  <div class="flex h-full align-center ">
    <edge-auth type="register" :registration-code="config.public.registrationCode" />
  </div>
</template>

<style lang="scss" scoped>

</style>
