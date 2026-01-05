<script setup lang="ts">
import ModuleEmptyState from '~/components/__MODULE_ID__/ModuleEmptyState.vue'

definePageMeta({
  middleware: 'auth',
})

const edgeGlobal = inject('edgeGlobal') as any

const state = reactive({
  mounted: false,
})

onMounted(() => {
  state.mounted = true
})
</script>

<template>
  <section v-if="edgeGlobal.edgeState.organizationDocPath && state.mounted" class="space-y-6">
    <header class="space-y-2">
      <p class="text-xs uppercase tracking-wide text-slate-500">__MODULE_LABEL__</p>
      <h1 class="text-2xl font-semibold text-slate-900">Manage your __MODULE_LABEL__ module</h1>
      <p class="text-sm text-slate-600">
        Use this space to build the admin UI for __MODULE_LABEL__.
      </p>
    </header>

    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <ModuleEmptyState />
    </div>
  </section>
</template>
