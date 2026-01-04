<script setup>
const edgeFirebase = inject('edgeFirebase')

const state = reactive({
  mounted: false,
  busyModule: '',
  error: '',
  selectedSiteId: '',
})

definePageMeta({
  middleware: 'auth',
})

const orgId = computed(() => edgeGlobal.edgeState.currentOrganization || '')

const registry = computed(() => useEdgeModuleRegistry())

const modules = computed(() => {
  return Object.values(registry.value || {})
})

const tenantModules = computed(() => {
  if (!orgId.value)
    return {}
  return edgeFirebase?.data?.[`organizations/${orgId.value}/modules`] || {}
})

const sites = computed(() => {
  if (!orgId.value)
    return []
  const raw = edgeFirebase?.data?.[`organizations/${orgId.value}/sites`] || {}
  return Object.entries(raw).map(([docId, site]) => ({
    docId,
    name: site?.name || docId,
  }))
})

const siteModules = computed(() => {
  if (!orgId.value || !state.selectedSiteId)
    return {}
  return edgeFirebase?.data?.[`organizations/${orgId.value}/sites/${state.selectedSiteId}/modules`] || {}
})

const hasTenantRecord = moduleId => Boolean(tenantModules.value?.[moduleId])
const isTenantEnabled = moduleId => Boolean(tenantModules.value?.[moduleId]?.enabled)

const hasSiteRecord = moduleId => Boolean(siteModules.value?.[moduleId])
const isSiteEnabled = moduleId => Boolean(siteModules.value?.[moduleId]?.enabled)

const loadSnapshots = async () => {
  if (!orgId.value)
    return
  await startEdgeModuleSnapshots(edgeFirebase, orgId.value, state.selectedSiteId || undefined)
  await edgeFirebase.startSnapshot(`organizations/${orgId.value}/sites`)
}

watch(orgId, async () => {
  if (!orgId.value)
    return
  await loadSnapshots()
})

watch(
  () => state.selectedSiteId,
  async (siteId) => {
    if (!orgId.value || !siteId)
      return
    await edgeFirebase.startSnapshot(`organizations/${orgId.value}/sites/${siteId}/modules`)
  },
)

onMounted(async () => {
  state.mounted = true
  await loadSnapshots()
})

const runAction = async (moduleId, action) => {
  state.error = ''
  state.busyModule = moduleId
  try {
    await action()
  }
  catch (err) {
    state.error = err?.message || String(err)
  }
  finally {
    state.busyModule = ''
  }
}

const installModule = moduleId => runAction(moduleId, () => installTenantModule(edgeFirebase, orgId.value, moduleId))
const upgradeModule = moduleId => runAction(moduleId, () => upgradeTenantModule(edgeFirebase, orgId.value, moduleId))
const enableModule = moduleId => runAction(moduleId, () => setTenantModuleEnabled(edgeFirebase, orgId.value, moduleId, true))
const disableModule = moduleId => runAction(moduleId, () => setTenantModuleEnabled(edgeFirebase, orgId.value, moduleId, false))

const enableSiteModule = moduleId => runAction(
  moduleId,
  () => installSiteModule(edgeFirebase, orgId.value, state.selectedSiteId, moduleId),
)

const disableSiteModule = moduleId => runAction(
  moduleId,
  () => setSiteModuleEnabled(edgeFirebase, orgId.value, state.selectedSiteId, moduleId, false),
)
</script>

<template>
  <div v-if="edgeGlobal.edgeState.organizationDocPath && state.mounted" class="flex-1">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Modules</h1>
      <p class="text-sm text-slate-500">
        Install and enable modules for your organization and sites.
      </p>
    </div>

    <div v-if="state.error" class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
      {{ state.error }}
    </div>

    <div class="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
      <label class="text-sm font-medium text-slate-600 dark:text-slate-300">
        Site override
      </label>
      <select
        v-model="state.selectedSiteId"
        class="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <option value="">Select a site (optional)</option>
        <option v-for="site in sites" :key="site.docId" :value="site.docId">
          {{ site.name }}
        </option>
      </select>
      <span class="text-xs text-slate-500">
        Site controls appear when a site is selected.
      </span>
    </div>

    <div v-if="modules.length === 0" class="rounded-md border border-dashed border-slate-300 p-6 text-sm text-slate-500">
      No modules are registered in this project. Install module code with the CLI first.
    </div>

    <div v-else class="grid gap-4">
      <div
        v-for="module in modules"
        :key="module.id"
        class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {{ module.id }}
              </h2>
              <span class="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                v{{ module.version }}
              </span>
            </div>
            <p v-if="module.description" class="text-sm text-slate-500">
              {{ module.description }}
            </p>
            <p v-else class="text-sm text-slate-400">
              No description provided.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <edge-shad-button
              v-if="!hasTenantRecord(module.id)"
              size="sm"
              class="bg-slate-900 text-white hover:bg-slate-700"
              :disabled="state.busyModule === module.id"
              @click="installModule(module.id)"
            >
              Install
            </edge-shad-button>
            <edge-shad-button
              v-else-if="!isTenantEnabled(module.id)"
              size="sm"
              class="bg-emerald-600 text-white hover:bg-emerald-500"
              :disabled="state.busyModule === module.id"
              @click="enableModule(module.id)"
            >
              Enable
            </edge-shad-button>
            <edge-shad-button
              v-else
              size="sm"
              variant="outline"
              :disabled="state.busyModule === module.id"
              @click="disableModule(module.id)"
            >
              Disable
            </edge-shad-button>
            <edge-shad-button
              v-if="hasTenantRecord(module.id)"
              size="sm"
              variant="outline"
              :disabled="state.busyModule === module.id"
              @click="upgradeModule(module.id)"
            >
              Upgrade
            </edge-shad-button>
          </div>
        </div>

        <div v-if="state.selectedSiteId && module.scope?.includes('site')" class="mt-4 rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold uppercase text-slate-500">Site</span>
            <span class="text-slate-700 dark:text-slate-200">
              {{ sites.find(site => site.docId === state.selectedSiteId)?.name || state.selectedSiteId }}
            </span>
            <template v-if="hasTenantRecord(module.id)">
              <edge-shad-button
                v-if="!hasSiteRecord(module.id)"
                size="sm"
                class="bg-slate-900 text-white hover:bg-slate-700"
                :disabled="state.busyModule === module.id"
                @click="enableSiteModule(module.id)"
              >
                Enable for site
              </edge-shad-button>
              <edge-shad-button
                v-else-if="!isSiteEnabled(module.id)"
                size="sm"
                class="bg-emerald-600 text-white hover:bg-emerald-500"
                :disabled="state.busyModule === module.id"
                @click="enableSiteModule(module.id)"
              >
                Enable for site
              </edge-shad-button>
              <edge-shad-button
                v-else
                size="sm"
                variant="outline"
                :disabled="state.busyModule === module.id"
                @click="disableSiteModule(module.id)"
              >
                Disable for site
              </edge-shad-button>
            </template>
            <span v-else class="text-xs text-slate-500">
              Install the module for the organization first.
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
