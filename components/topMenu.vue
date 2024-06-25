<script setup>
import {
  Package,
} from 'lucide-vue-next'
const edgeFirebase = inject('edgeFirebase')
// const edgeGlobal = inject('edgeGlobal')
</script>

<template>
  <header class="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
    <Package class="h-6 w-6 mr-2" />
    <h1 class="text-xl font-bold">
      Edge
    </h1>
    <nav class="ml-4 hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
      <NuxtLink to="/app/dashboard" class="text-foreground transition-colors hover:text-foreground">
        Dashboard
      </NuxtLink>
      <NuxtLink to="/app/dashboard/subthings" class="text-muted-foreground text-foreground transition-colors hover:text-foreground">
        Sub Things
      </NuxtLink>
    </nav>
    <div class="grow text-right">
      <user-menu />
    </div>
  </header>
  <!-- <v-app-bar v-if="edgeFirebase.user.loggedIn">
    <v-spacer />
    <user-menu />
  </v-app-bar> -->
</template>

<style lang="scss" scoped>
  .inverted-logo {
    filter: invert(1);
  }
</style>
