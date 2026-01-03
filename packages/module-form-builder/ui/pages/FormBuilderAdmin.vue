<script setup lang="ts">
import FormBuilderEmptyState from '../components/FormBuilderEmptyState.vue'

const forms = []
</script>

<template>
  <section class="space-y-6">
    <header class="space-y-2">
      <p class="text-xs uppercase tracking-wide text-slate-500">Form Builder</p>
      <h1 class="text-2xl font-semibold text-slate-900">Manage your forms</h1>
      <p class="text-sm text-slate-600">
        Build custom intake forms, surveys, and lead capture experiences for each site.
      </p>
    </header>

    <div class="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-800">Forms</p>
          <p class="text-xs text-slate-500">Draft and published forms live here.</p>
        </div>
        <button class="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
          New form
        </button>
      </div>

      <FormBuilderEmptyState v-if="forms.length === 0" />
    </div>
  </section>
</template>
