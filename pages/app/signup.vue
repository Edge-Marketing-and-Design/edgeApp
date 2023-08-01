<script setup>
const config = useRuntimeConfig()
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" class="fill-height" justify="center">
      <v-col cols="12" class="center-align" sm="8" md="6">
        <edge-auth type="register" :registration-code="config.public.registrationCode" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>

</style>
