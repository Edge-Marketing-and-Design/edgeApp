<script setup>
const edgeFirebase = inject('edgeFirebase')
const edgeGlobal = inject('edgeGlobal')
</script>

<template>
  <v-bottom-navigation>
    <v-btn to="/app/dashboard">
      <v-icon>mdi-view-dashboard</v-icon>

      Dashboard
    </v-btn>
    <v-btn to="/app/dashboard/subthings">
      <v-icon>mdi-cube</v-icon>

      Sub Things
    </v-btn>

    <v-btn to="/app/account/organization-settings">
      <v-icon>mdi-cog</v-icon>

      Settings
    </v-btn>

    <v-btn @click="logOut(edgeFirebase, edgeGlobal)">
      <v-icon>mdi-logout</v-icon>

      Logout
    </v-btn>
  </v-bottom-navigation>
</template>

<style lang="scss" scoped>

</style>
