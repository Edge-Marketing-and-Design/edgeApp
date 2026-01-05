<script setup lang="ts">
import draggable from 'vuedraggable'
import { computed, inject, onMounted, reactive, watch } from 'vue'
import FormBuilderEmptyState from '~/components/form-builder/FormBuilderEmptyState.vue'
import { buildSchemaFromFields, schemaToFields } from './schema-utils'

definePageMeta({
  middleware: 'auth',
})

const edgeFirebase = inject('edgeFirebase') as any
const edgeGlobal = inject('edgeGlobal') as any

type FormFieldDraft = {
  id: string
  label: string
  type: string
  required: boolean
  options?: string[]
  helpText?: string
  placeholder?: string
  min?: number
  max?: number
  pattern?: string
  ui?: Record<string, unknown>
  _key: string
}

const fieldTypeOptions = ['shortText', 'longText', 'email', 'number', 'select', 'checkbox', 'date']
const fieldTypeLabels: Record<string, string> = {
  shortText: 'Short text',
  longText: 'Long text',
  email: 'Email',
  number: 'Number',
  select: 'Select',
  checkbox: 'Checkbox',
  date: 'Date',
}

const snapshotPaths = {
  sites: '',
  forms: '',
  versions: '',
}

let schemaSyncTimer: ReturnType<typeof setTimeout> | null = null
const schemaSyncDelayMs = 200

const state = reactive({
  filter: '',
  mounted: false,
  selectedSiteId: '',
  selectedFormId: '',
  showCreate: false,
  compareVersionId: '',
  activatingVersionId: '',
  createError: '',
  creating: false,
  editor: {
    mode: 'fields' as 'fields' | 'json',
    error: '',
    saving: false,
    showAdvanced: false,
    fields: [] as FormFieldDraft[],
    schemaJson: '',
    uiSchemaJson: '{}',
  },
  newForm: {
    name: '',
    description: '',
    visibility: 'authenticated',
    status: 'draft',
  },
})

const orgId = computed(() => edgeGlobal.edgeState.currentOrganization || '')

const sites = computed(() => {
  if (!orgId.value) {
    return []
  }
  const raw = edgeFirebase?.data?.[`organizations/${orgId.value}/sites`] || {}
  return Object.entries(raw).map(([docId, site]) => ({
    docId,
    name: site?.name || docId,
  }))
})

const formsCollectionPath = computed(() => {
  if (!orgId.value || !state.selectedSiteId) {
    return ''
  }
  return `organizations/${orgId.value}/sites/${state.selectedSiteId}/forms`
})

const versionsCollectionPath = computed(() => {
  if (!orgId.value || !state.selectedSiteId) {
    return ''
  }
  return `organizations/${orgId.value}/sites/${state.selectedSiteId}/formVersions`
})

const forms = computed(() => {
  if (!formsCollectionPath.value) {
    return []
  }
  const raw = edgeFirebase?.data?.[formsCollectionPath.value] || {}
  const list = Object.entries(raw).map(([docId, form]) => ({
    docId,
    ...form,
  }))
  if (!state.filter) {
    return list
  }
  const filter = state.filter.trim().toLowerCase()
  return list.filter(item =>
    String(item.name || '').toLowerCase().includes(filter)
    || String(item.description || '').toLowerCase().includes(filter),
  )
})

const versions = computed(() => {
  if (!versionsCollectionPath.value) {
    return []
  }
  const raw = edgeFirebase?.data?.[versionsCollectionPath.value] || {}
  return Object.entries(raw).map(([docId, version]) => ({
    docId,
    ...version,
  }))
})

const selectedForm = computed(() => {
  if (!state.selectedFormId) {
    return null
  }
  return forms.value.find(form => form.docId === state.selectedFormId) || null
})

const selectedFormId = computed(() => selectedForm.value?.id || selectedForm.value?.docId || '')

const formVersions = computed(() => {
  if (!selectedFormId.value) {
    return []
  }
  return versions.value.filter(version => version.formId === selectedFormId.value)
})

const sortedFormVersions = computed(() => {
  return [...formVersions.value].sort((a, b) => {
    const versionA = Number.isFinite(a.version) ? Number(a.version) : 0
    const versionB = Number.isFinite(b.version) ? Number(b.version) : 0
    if (versionA !== versionB) {
      return versionB - versionA
    }
    return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
  })
})

const activeVersion = computed(() => {
  const activeId = selectedForm.value?.activeVersionId
  if (!activeId) {
    return null
  }
  return formVersions.value.find(version => version.id === activeId || version.docId === activeId) || null
})

const activeVersionId = computed(() => {
  if (!activeVersion.value) {
    return ''
  }
  return activeVersion.value.id || activeVersion.value.docId || ''
})

const compareVersion = computed(() => {
  if (!state.compareVersionId) {
    return null
  }
  return formVersions.value.find(version => (version.id || version.docId) === state.compareVersionId) || null
})

const activeVersionLabel = computed(() => {
  if (!activeVersion.value) {
    return 'Legacy'
  }
  const versionNumber = activeVersion.value?.version || 1
  const versionId = activeVersion.value?.id || activeVersion.value?.docId || ''
  return `v${versionNumber} (${versionId})`
})

const formatFieldType = (value: string) => fieldTypeLabels[value] || value
const isNumberField = (value: string) => value === 'number'
const isTextField = (value: string) => ['shortText', 'longText', 'email'].includes(value)

const syncSchemaFromFields = (immediate = false) => {
  if (schemaSyncTimer) {
    clearTimeout(schemaSyncTimer)
    schemaSyncTimer = null
  }
  const run = () => {
    state.editor.schemaJson = JSON.stringify(buildSchemaFromFields(state.editor.fields), null, 2)
  }
  if (immediate) {
    run()
    return
  }
  schemaSyncTimer = setTimeout(run, schemaSyncDelayMs)
}

const getVersionSchema = (version: any) => {
  if (!version) {
    return {}
  }
  return version.schema || buildSchemaFromFields(version.fields || [])
}

const getVersionSchemaJson = (version: any) => {
  return JSON.stringify(getVersionSchema(version) || {}, null, 2)
}


const createField = (overrides: Partial<FormFieldDraft> = {}): FormFieldDraft => {
  return {
    id: '',
    label: '',
    type: 'shortText',
    required: false,
    options: [],
    helpText: '',
    placeholder: '',
    min: undefined,
    max: undefined,
    pattern: '',
    ui: {},
    _key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...overrides,
  }
}

const hydrateFields = (fields: any[] = []) => {
  return fields.map((field, index) => createField({
    id: String(field?.id || ''),
    label: String(field?.label || ''),
    type: field?.type || 'shortText',
    required: Boolean(field?.required),
    options: Array.isArray(field?.options) ? [...field.options] : [],
    helpText: field?.helpText || '',
    placeholder: field?.placeholder || '',
    min: typeof field?.min === 'number' ? field.min : undefined,
    max: typeof field?.max === 'number' ? field.max : undefined,
    pattern: field?.pattern || '',
    ui: field?.ui || {},
    _key: field?._key || `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
  }))
}

const parseJsonValue = (value: string, label: string) => {
  if (!value) {
    return {}
  }
  try {
    const parsed = JSON.parse(value)
    state.editor.error = ''
    return parsed
  }
  catch (err) {
    state.editor.error = `${label} must be valid JSON.`
    return null
  }
}

const syncEditor = () => {
  const form = selectedForm.value
  if (!form) {
    state.editor.fields = []
    state.editor.schemaJson = ''
    state.editor.uiSchemaJson = '{}'
    state.editor.error = ''
    state.compareVersionId = ''
    return
  }

  const version = activeVersion.value
  const schema = version?.schema || buildSchemaFromFields(version?.fields || form?.fields || [])
  const fields = Array.isArray(version?.fields) && version.fields.length
    ? version.fields
    : schemaToFields(schema)

  state.editor.fields = hydrateFields(fields)
  state.editor.schemaJson = JSON.stringify(schema || {}, null, 2)
  state.editor.uiSchemaJson = JSON.stringify(version?.uiSchema || {}, null, 2)
  state.editor.error = ''
  state.compareVersionId = ''
}

const loadSnapshots = async () => {
  if (!orgId.value) {
    return
  }
  const sitesPath = `organizations/${orgId.value}/sites`
  if (snapshotPaths.sites !== sitesPath) {
    snapshotPaths.sites = sitesPath
    await edgeFirebase.startSnapshot(sitesPath)
  }
}

const loadSiteSnapshots = async () => {
  if (!formsCollectionPath.value || !versionsCollectionPath.value) {
    return
  }
  if (snapshotPaths.forms !== formsCollectionPath.value) {
    snapshotPaths.forms = formsCollectionPath.value
    await edgeFirebase.startSnapshot(formsCollectionPath.value)
  }
  if (snapshotPaths.versions !== versionsCollectionPath.value) {
    snapshotPaths.versions = versionsCollectionPath.value
    await edgeFirebase.startSnapshot(versionsCollectionPath.value)
  }
}

const slugify = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

const resolveUniqueFormId = (baseId: string) => {
  if (!formsCollectionPath.value) {
    return baseId
  }
  const existing = edgeFirebase?.data?.[formsCollectionPath.value] || {}
  if (!existing[baseId]) {
    return baseId
  }
  let suffix = 2
  let candidate = `${baseId}-${suffix}`
  while (existing[candidate]) {
    suffix += 1
    if (suffix > 50) {
      return `${baseId}-${Date.now()}`
    }
    candidate = `${baseId}-${suffix}`
  }
  return candidate
}

const resetCreateForm = () => {
  state.newForm.name = ''
  state.newForm.description = ''
  state.newForm.visibility = 'authenticated'
  state.newForm.status = 'draft'
  state.createError = ''
}

const createForm = async () => {
  state.createError = ''
  if (!formsCollectionPath.value || !versionsCollectionPath.value) {
    state.createError = 'Select a site before creating a form.'
    return
  }
  const formId = slugify(state.newForm.name)
  if (!formId) {
    state.createError = 'Form name is required.'
    return
  }
  const uniqueFormId = resolveUniqueFormId(formId)
  const timestamp = new Date().toISOString()
  const versionId = `${uniqueFormId}-v1`
  const schema = {
    type: 'object',
    properties: {},
  }

  state.creating = true
  try {
    await edgeFirebase.storeDoc(versionsCollectionPath.value, {
      docId: versionId,
      formId: uniqueFormId,
      version: 1,
      schema,
      uiSchema: {},
      integrations: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    await edgeFirebase.storeDoc(formsCollectionPath.value, {
      docId: uniqueFormId,
      name: state.newForm.name,
      description: state.newForm.description,
      status: state.newForm.status,
      visibility: state.newForm.visibility,
      activeVersionId: versionId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    resetCreateForm()
    state.showCreate = false
  }
  catch (err: any) {
    state.createError = err?.message || String(err)
  }
  finally {
    state.creating = false
  }
}

const addField = () => {
  const nextIndex = state.editor.fields.length + 1
  state.editor.fields.push(createField({
    label: `Field ${nextIndex}`,
    id: `field-${nextIndex}`,
  }))
}

const removeField = (key: string) => {
  state.editor.fields = state.editor.fields.filter(field => field._key !== key)
}

const setEditorMode = (mode: 'fields' | 'json') => {
  if (mode === state.editor.mode) {
    return
  }
  state.editor.error = ''
  if (mode === 'json') {
    syncSchemaFromFields(true)
    state.editor.mode = 'json'
    return
  }

  const parsedSchema = parseJsonValue(state.editor.schemaJson, 'Schema JSON')
  if (!parsedSchema) {
    return
  }
  state.editor.fields = hydrateFields(schemaToFields(parsedSchema))
  state.editor.schemaJson = JSON.stringify(parsedSchema, null, 2)
  state.editor.mode = 'fields'
  state.editor.error = ''
}

const getNextVersionNumber = () => {
  const maxVersion = formVersions.value.reduce((max, version) => {
    const versionNumber = Number.isFinite(version.version) ? Number(version.version) : 0
    return Math.max(max, versionNumber)
  }, 0)
  return maxVersion + 1
}

const saveVersion = async () => {
  state.editor.error = ''
  if (!formsCollectionPath.value || !versionsCollectionPath.value) {
    state.editor.error = 'Select a site and form before saving.'
    return
  }
  if (!selectedForm.value) {
    state.editor.error = 'Select a form to edit.'
    return
  }

  const formId = selectedFormId.value
  const timestamp = new Date().toISOString()
  const uiSchema = parseJsonValue(state.editor.uiSchemaJson || '{}', 'UI Schema JSON')
  if (uiSchema === null) {
    return
  }

  let schema = {}
  if (state.editor.mode === 'json') {
    const parsedSchema = parseJsonValue(state.editor.schemaJson, 'Schema JSON')
    if (!parsedSchema) {
      return
    }
    schema = parsedSchema
  }
  else {
    schema = buildSchemaFromFields(state.editor.fields)
  }

  const fields = state.editor.mode === 'json'
    ? schemaToFields(schema)
    : state.editor.fields.map((field, index) => {
      const id = field.id || slugify(field.label) || `field-${index + 1}`
      const payload: Record<string, any> = {
        id,
        label: field.label || id,
        type: field.type || 'shortText',
        required: Boolean(field.required),
        options: field.type === 'select' && Array.isArray(field.options)
          ? field.options.filter(option => option)
          : undefined,
      }
      if (field.helpText) {
        payload.helpText = field.helpText
      }
      if (field.placeholder) {
        payload.placeholder = field.placeholder
      }
      if (typeof field.min === 'number') {
        payload.min = field.min
      }
      if (typeof field.max === 'number') {
        payload.max = field.max
      }
      if (field.pattern) {
        payload.pattern = field.pattern
      }
      if (field.ui && Object.keys(field.ui).length) {
        payload.ui = field.ui
      }
      return payload
    })

  const nextVersion = getNextVersionNumber()
  const versionId = `${formId}-v${nextVersion}`

  state.editor.saving = true
  try {
    await edgeFirebase.storeDoc(versionsCollectionPath.value, {
      docId: versionId,
      formId,
      version: nextVersion,
      schema,
      uiSchema,
      fields,
      integrations: activeVersion.value?.integrations || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    await edgeFirebase.storeDoc(formsCollectionPath.value, {
      docId: formId,
      activeVersionId: versionId,
      updatedAt: timestamp,
    })
    state.editor.schemaJson = JSON.stringify(schema, null, 2)
  }
  catch (err: any) {
    state.editor.error = err?.message || String(err)
  }
  finally {
    state.editor.saving = false
  }
}

const activateVersion = async (version: any) => {
  state.editor.error = ''
  if (!formsCollectionPath.value || !selectedForm.value) {
    return
  }
  const versionId = version?.id || version?.docId
  if (!versionId) {
    return
  }
  const timestamp = new Date().toISOString()
  const formId = selectedFormId.value

  state.activatingVersionId = versionId
  try {
    await edgeFirebase.storeDoc(formsCollectionPath.value, {
      docId: formId,
      activeVersionId: versionId,
      updatedAt: timestamp,
    })
  }
  catch (err: any) {
    state.editor.error = err?.message || String(err)
  }
  finally {
    state.activatingVersionId = ''
  }
}

watch(orgId, async (value) => {
  if (!value) {
    return
  }
  await loadSnapshots()
})

watch(
  () => sites.value,
  (list) => {
    if (!state.selectedSiteId && list.length) {
      state.selectedSiteId = list[0].docId
    }
  },
)

watch(
  () => state.selectedSiteId,
  async () => {
    if (!formsCollectionPath.value) {
      return
    }
    state.selectedFormId = ''
    await loadSiteSnapshots()
  },
)

watch(
  () => forms.value,
  (list) => {
    if (!list.length) {
      state.selectedFormId = ''
      return
    }
    if (!state.selectedFormId || !list.find(form => form.docId === state.selectedFormId)) {
      state.selectedFormId = list[0].docId
    }
  },
  { deep: true },
)

watch(
  () => [state.selectedFormId, activeVersion.value?.id, activeVersion.value?.updatedAt],
  () => {
    syncEditor()
  },
)

watch(
  () => state.editor.fields,
  () => {
    if (state.editor.mode === 'fields') {
      syncSchemaFromFields()
    }
  },
  { deep: true },
)

onMounted(async () => {
  state.mounted = true
  await loadSnapshots()
})
</script>

<template>
  <section v-if="edgeGlobal.edgeState.organizationDocPath && state.mounted" class="space-y-6">
    <header class="space-y-2">
      <p class="text-xs uppercase tracking-wide text-slate-500">Form Builder</p>
      <h1 class="text-2xl font-semibold text-slate-900">Manage your forms</h1>
      <p class="text-sm text-slate-600">
        Build custom intake forms, surveys, and lead capture experiences for each site.
      </p>
    </header>

    <div class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label class="text-xs font-semibold uppercase text-slate-500">Site</label>
          <select
            v-model="state.selectedSiteId"
            class="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
          >
            <option value="">Select a site</option>
            <option v-for="site in sites" :key="site.docId" :value="site.docId">
              {{ site.name }}
            </option>
          </select>
        </div>
        <div class="flex flex-wrap gap-2">
          <edge-shad-input
            v-model="state.filter"
            name="form-filter"
            placeholder="Search forms..."
            class="w-full md:w-60"
          />
          <edge-shad-button
            class="bg-slate-900 text-white hover:bg-slate-700"
            :disabled="!state.selectedSiteId"
            @click="state.showCreate = !state.showCreate"
          >
            {{ state.showCreate ? 'Close' : 'New form' }}
          </edge-shad-button>
        </div>
      </div>

      <div v-if="state.showCreate" class="rounded-md border border-slate-200 bg-slate-50 p-4">
        <div class="grid gap-3 md:grid-cols-2">
          <edge-shad-input
            v-model="state.newForm.name"
            name="form-name"
            label="Name"
            placeholder="Customer intake"
          />
          <edge-shad-input
            v-model="state.newForm.description"
            name="form-description"
            label="Description"
            placeholder="Tell us about your request"
          />
          <label class="text-xs font-semibold uppercase text-slate-500">
            Visibility
            <select
              v-model="state.newForm.visibility"
              class="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
            >
              <option value="authenticated">Authenticated</option>
              <option value="public">Public</option>
              <option value="both">Both</option>
            </select>
          </label>
          <label class="text-xs font-semibold uppercase text-slate-500">
            Status
            <select
              v-model="state.newForm.status"
              class="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
        </div>
        <div v-if="state.createError" class="mt-3 text-sm text-red-600">
          {{ state.createError }}
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <edge-shad-button
            class="bg-slate-900 text-white hover:bg-slate-700"
            :disabled="state.creating"
            @click="createForm"
          >
            {{ state.creating ? 'Creating…' : 'Create form' }}
          </edge-shad-button>
          <edge-shad-button variant="outline" @click="resetCreateForm">
            Reset
          </edge-shad-button>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-800">Forms</p>
          <p class="text-xs text-slate-500">Draft and published forms live here.</p>
        </div>
        <span class="text-xs text-slate-500">
          {{ forms.length }} total
        </span>
      </div>

      <FormBuilderEmptyState v-if="forms.length === 0" class="mt-4" />
      <div
        v-else
        class="mt-4 grid gap-4"
        style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));"
      >
        <div
          v-for="form in forms"
          :key="form.docId"
          role="button"
          tabindex="0"
          class="rounded-lg border bg-slate-50 p-4 shadow-sm transition"
          :class="state.selectedFormId === form.docId ? 'border-slate-900 ring-1 ring-slate-900/20' : 'border-slate-200'"
          @click="state.selectedFormId = form.docId"
          @keyup.enter="state.selectedFormId = form.docId"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-sm font-semibold text-slate-800">{{ form.name }}</p>
              <p class="text-xs text-slate-500">{{ form.description || 'No description' }}</p>
            </div>
            <span
              class="rounded-full px-2 py-1 text-[10px] font-semibold uppercase"
              :class="form.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'"
            >
              {{ form.status || 'draft' }}
            </span>
          </div>
          <div class="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span class="rounded-full bg-white px-2 py-1">Visibility: {{ form.visibility || 'authenticated' }}</span>
            <span class="rounded-full bg-white px-2 py-1">Version: {{ form.activeVersionId || 'none' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-800">Schema editor</p>
          <p class="text-xs text-slate-500">
            {{ selectedForm ? `Editing ${selectedForm.name}` : 'Select a form to edit its schema.' }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <edge-shad-button
            variant="outline"
            size="sm"
            :disabled="!selectedForm"
            :class="state.editor.mode === 'fields' ? 'border-slate-900 text-slate-900' : ''"
            @click="setEditorMode('fields')"
          >
            Fields
          </edge-shad-button>
          <edge-shad-button
            variant="outline"
            size="sm"
            :disabled="!selectedForm"
            :class="state.editor.mode === 'json' ? 'border-slate-900 text-slate-900' : ''"
            @click="setEditorMode('json')"
          >
            JSON
          </edge-shad-button>
          <edge-shad-button
            size="sm"
            class="bg-slate-900 text-white hover:bg-slate-700"
            :disabled="!selectedForm || state.editor.saving"
            @click="saveVersion"
          >
            {{ state.editor.saving ? 'Saving…' : 'Save new version' }}
          </edge-shad-button>
        </div>
      </div>

      <div v-if="!selectedForm" class="mt-4 rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        Select a form from the list to start editing fields and schema.
      </div>

      <div v-else class="mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold text-slate-800">Fields</p>
            <div class="flex flex-wrap gap-2">
              <edge-shad-button
                variant="outline"
                size="sm"
                @click="state.editor.showAdvanced = !state.editor.showAdvanced"
              >
                {{ state.editor.showAdvanced ? 'Hide advanced' : 'Advanced fields' }}
              </edge-shad-button>
              <edge-shad-button variant="outline" size="sm" @click="addField">
                Add field
              </edge-shad-button>
            </div>
          </div>

          <edge-form class="mt-4">
            <draggable
              v-model="state.editor.fields"
              item-key="_key"
              handle=".field-drag-handle"
              class="space-y-3"
            >
              <template #item="{ element, index }">
                <div class="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                      <span class="field-drag-handle cursor-grab rounded bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-wide">drag</span>
                      <span class="font-semibold">Field {{ index + 1 }}</span>
                      <span>{{ formatFieldType(element.type) }}</span>
                    </div>
                    <edge-shad-button
                      size="sm"
                      variant="ghost"
                      class="text-slate-500 hover:text-slate-900"
                      @click="removeField(element._key)"
                    >
                      Remove
                    </edge-shad-button>
                  </div>
                  <div class="mt-3 grid gap-3 md:grid-cols-2">
                    <edge-g-input
                      v-model="element.label"
                      :name="`field-label-${element._key}`"
                      field-type="text"
                      label="Label"
                      placeholder="Full name"
                    />
                    <edge-g-input
                      v-model="element.id"
                      :name="`field-id-${element._key}`"
                      field-type="text"
                      label="Key"
                      placeholder="fullName"
                    />
                    <edge-g-input
                      v-model="element.type"
                      :name="`field-type-${element._key}`"
                      field-type="select"
                      label="Type"
                      :items="fieldTypeOptions"
                    />
                    <edge-g-input
                      v-model="element.required"
                      :name="`field-required-${element._key}`"
                      field-type="boolean"
                      label="Required"
                    />
                    <edge-g-input
                      v-if="element.type === 'select'"
                      v-model="element.options"
                      :name="`field-options-${element._key}`"
                      field-type="stringArray"
                      label="Options"
                      helper="Enter options as a list"
                    />
                  </div>
                  <div v-if="state.editor.showAdvanced" class="mt-3 grid gap-3 md:grid-cols-2">
                    <edge-g-input
                      v-model="element.helpText"
                      :name="`field-help-${element._key}`"
                      field-type="text"
                      label="Help text"
                      placeholder="Add guidance for this field"
                    />
                    <edge-g-input
                      v-model="element.placeholder"
                      :name="`field-placeholder-${element._key}`"
                      field-type="text"
                      label="Placeholder"
                      placeholder="Example input"
                    />
                    <edge-g-input
                      v-if="isNumberField(element.type) || isTextField(element.type)"
                      v-model="element.min"
                      :name="`field-min-${element._key}`"
                      field-type="number"
                      :label="isNumberField(element.type) ? 'Minimum' : 'Min length'"
                    />
                    <edge-g-input
                      v-if="isNumberField(element.type) || isTextField(element.type)"
                      v-model="element.max"
                      :name="`field-max-${element._key}`"
                      field-type="number"
                      :label="isNumberField(element.type) ? 'Maximum' : 'Max length'"
                    />
                    <edge-g-input
                      v-if="isTextField(element.type)"
                      v-model="element.pattern"
                      :name="`field-pattern-${element._key}`"
                      field-type="text"
                      label="Pattern"
                      helper="Regex for validation"
                    />
                  </div>
                </div>
              </template>
            </draggable>
          </edge-form>
        </div>

        <div class="space-y-4">
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-slate-800">Schema</p>
              <span class="text-xs text-slate-500">Active: {{ activeVersionLabel }}</span>
            </div>
            <div class="mt-3 space-y-3">
              <edge-g-input
                v-if="state.editor.mode === 'json'"
                v-model="state.editor.schemaJson"
                name="schema-json"
                field-type="textarea"
                label="Schema JSON"
                helper="Edit the JSON schema directly."
              />
              <edge-g-input
                v-if="state.editor.mode === 'json'"
                v-model="state.editor.uiSchemaJson"
                name="ui-schema-json"
                field-type="textarea"
                label="UI Schema JSON"
                helper="Optional UI hints for your renderer."
              />
              <pre v-else class="max-h-[360px] overflow-auto rounded-md bg-white p-3 text-xs text-slate-600 shadow-sm">{{ state.editor.schemaJson }}</pre>
            </div>
            <div class="mt-3 text-xs text-slate-500">
              Saving creates a new version and updates the active version for this form.
            </div>
          </div>

          <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-slate-800">Version history</p>
              <span class="text-xs text-slate-500">{{ sortedFormVersions.length }} versions</span>
            </div>
            <div v-if="sortedFormVersions.length === 0" class="mt-3 text-xs text-slate-500">
              No versions yet. Save a schema to create the first version.
            </div>
            <div v-else class="mt-3 space-y-2">
              <div
                v-for="version in sortedFormVersions"
                :key="version.id || version.docId"
                class="rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-600"
              >
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <p class="text-sm font-semibold text-slate-800">v{{ version.version || 1 }}</p>
                    <p class="text-xs text-slate-500">{{ version.id || version.docId }}</p>
                  </div>
                  <span
                    v-if="(version.id || version.docId) === activeVersionId"
                    class="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-700"
                  >
                    Active
                  </span>
                </div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <edge-shad-button
                    size="sm"
                    variant="outline"
                    :disabled="state.activatingVersionId === (version.id || version.docId)"
                    @click="activateVersion(version)"
                  >
                    {{ state.activatingVersionId === (version.id || version.docId) ? 'Activating…' : 'Activate' }}
                  </edge-shad-button>
                  <edge-shad-button
                    size="sm"
                    variant="ghost"
                    @click="state.compareVersionId = version.id || version.docId"
                  >
                    Compare
                  </edge-shad-button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="compareVersion" class="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-slate-800">Compare versions</p>
              <edge-shad-button size="sm" variant="ghost" @click="state.compareVersionId = ''">
                Clear
              </edge-shad-button>
            </div>
            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p class="text-xs font-semibold uppercase text-slate-500">Active</p>
                <pre class="mt-2 max-h-64 overflow-auto rounded-md bg-white p-3 text-[11px] text-slate-600 shadow-sm">{{ getVersionSchemaJson(activeVersion) }}</pre>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase text-slate-500">Selected</p>
                <pre class="mt-2 max-h-64 overflow-auto rounded-md bg-white p-3 text-[11px] text-slate-600 shadow-sm">{{ getVersionSchemaJson(compareVersion) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="state.editor.error" class="mt-4 text-sm text-red-600">
        {{ state.editor.error }}
      </div>
    </div>
  </section>
</template>
