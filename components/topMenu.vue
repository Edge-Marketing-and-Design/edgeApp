<script setup>
const edgeFirebase = inject('edgeFirebase')
const edgeGlobal = inject('edgeGlobal')
</script>

<template>
  <v-app-bar v-if="edgeFirebase.user.loggedIn">
    <v-spacer />
    <user-menu />
  </v-app-bar>
</template>

<style lang="scss" scoped>
  .inverted-logo {
    filter: invert(1);
  }
</style>
