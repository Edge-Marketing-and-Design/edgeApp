<script setup>
const config = useRuntimeConfig()
</script>

<template>
  <div class="flex w-full h-full align-center  overflow-y-auto">
    <edge-auth type="register" :registration-code="config.public.registrationCode" class="p-8 mx-auto max-w-lg w-full">
      <div class="grid gap-2 text-center">
        <h1 class="text-2xl font-bold">
          Sign Up
        </h1>
      </div>
    </edge-auth>
  </div>
</template>

<style lang="scss" scoped>

</style>
