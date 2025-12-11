<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-vue-next'
const route = useRoute()
// const edgeGlobal = inject('edgeGlobal')

const edgeFirebase = inject('edgeFirebase')
const isAiBusy = status => status === 'queued' || status === 'running'

const state = reactive({
  filter: '',
  newDocs: {
    sites: {
      name: { bindings: { 'field-type': 'text', 'label': 'Name', 'helper': 'Name' }, cols: '12', value: '' },
    },
  },
})

const schemas = {
  sites: toTypedSchema(z.object({
    name: z.string({
      required_error: 'Name is required',
    }).min(1, { message: 'Name is required' }),
  })),
}

const collection = computed(() => {
  if (route.params.collection) {
    return route.params.collection
  }
  return ''
})
const docId = computed(() => {
  if (route.params.docId) {
    return route.params.docId
  }
  return ''
})
definePageMeta({
  middleware: 'auth',
})

onBeforeMount(() => {
  // edgeGlobal.showLeftPanel(true)
})
const isAdmin = computed(() => {
  return edgeGlobal.isAdminGlobal(edgeFirebase).value
})
const queryField = computed(() => {
  if (!isAdmin.value) {
    return 'users'
  }
  return ''
})

const queryValue = computed(() => {
  if (!isAdmin.value) {
    return [edgeFirebase?.user?.uid]
  }
  return ''
})

const queryOperator = computed(() => {
  if (!isAdmin.value) {
    return 'array-contains-any'
  }
  return ''
})
</script>

<template>
  <div
    v-if="edgeGlobal.edgeState.organizationDocPath"
  >
    <edge-dashboard :load-first-if-one="!isAdmin" :filter="state.filter" :query-field="queryField" :query-value="queryValue" :query-operator="queryOperator" collection="sites" class="flex-1 pt-0">
      <template #list="slotProps">
        <template v-for="item in slotProps.filtered" :key="item.docId">
          <edge-shad-button
            variant="text"
            class="cursor-pointer w-full flex justify-between items-center py-2 gap-3"
            :to="isAiBusy(item.aiBootstrapStatus) ? undefined : `/app/dashboard/sites/${item.docId}`"
            :disabled="isAiBusy(item.aiBootstrapStatus)"
          >
            <div>
              <Avatar class="cursor-pointer p-0 h-8 w-8 mr-2">
                <FilePenLine class="h-5 w-5" />
              </Avatar>
            </div>
            <div class="grow text-left">
              <div class="text-lg">
                {{ item.name }}
              </div>
              <div v-if="isAiBusy(item.aiBootstrapStatus)" class="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 class="h-3 w-3 animate-spin" />
                <span>AI is preparing this site</span>
              </div>
            </div>
            <div>
              <edge-shad-button
                size="icon"
                class="bg-slate-600 h-7 w-7"
                @click.stop="slotProps.deleteItem(item.docId)"
              >
                <Trash class="h-5 w-5" />
              </edge-shad-button>
            </div>
          </edge-shad-button>
          <Separator class="dark:bg-slate-600" />
        </template>
      </template>
    </edge-dashboard>
  </div>
</template>
