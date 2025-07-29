<script setup>
const config = useRuntimeConfig()
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <edge-auth type="register" :registration-code="config.public.registrationCode" class="p-8 mx-auto max-w-lg w-full h-full max-h-[760px] overflow-y-auto">
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
