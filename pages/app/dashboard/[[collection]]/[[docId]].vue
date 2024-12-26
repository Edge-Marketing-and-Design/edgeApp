<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
const route = useRoute()
const router = useRouter()
// const edgeGlobal = inject('edgeGlobal')

const edgeFirebase = inject('edgeFirebase')

const state = reactive({
  filter: '',
  newDocs: {
    things: {
      name: { bindings: { 'field-type': 'text', 'label': 'Name', 'helper': 'Name' }, cols: '12', value: '' },
      description: { bindings: { 'field-type': 'text', 'label': 'Description', 'helper': 'Description' }, cols: '12', value: '' },
      subthings: { bindings: { 'field-type': 'collection', 'label': 'Subthings', 'helper': 'Subthings', 'collection-path': 'subthings' }, cols: '12', value: '' },
    },
    subthings: {
      name: { bindings: { 'field-type': 'text', 'label': 'Name', 'helper': 'Name' }, cols: '6', value: '' },
      test: { bindings: { 'field-type': 'boolean', 'label': 'Description', 'helper': 'Test' }, cols: '6', value: '' },
      selectTest: { bindings: { 'field-type': 'select', 'label': 'Select', 'helper': 'Select', 'items': ['test1', 'test2', 'test3'] }, cols: '12', value: '' },
      testtextarea: { bindings: { 'field-type': 'textarea', 'label': 'Test Textarea', 'helper': 'Textarea' }, cols: '12', value: '' },
      arrayThing: { bindings: { 'field-type': 'array', 'label': 'Array', 'helper': 'Array' }, cols: '12', value: [] },
      objectThing: { bindings: { 'field-type': 'object', 'label': 'Object', 'helper': 'Obj' }, cols: '12', value: {} },
      stringArray: { bindings: { 'field-type': 'stringArray', 'label': 'stringArray', 'helper': 'Obj' }, cols: '12', value: [] },
      numberArray: { bindings: { 'field-type': 'numberArray', 'label': 'numberArray', 'helper': 'Obj' }, cols: '12', value: [] },
      intArray: { bindings: { 'field-type': 'intArray', 'label': 'intArray', 'helper': 'Obj' }, cols: '12', value: [] },
      usersThing: { bindings: { 'field-type': 'users', 'label': 'Users', 'helper': 'Users', 'hint': 'Choose a user' }, cols: '12', value: '' },
      numberTest: { bindings: { 'field-type': 'number', 'label': 'Number', 'helper': 'Number' }, cols: '12', value: 0 },
      intTest: { bindings: { 'field-type': 'integer', 'label': 'Int', 'helper': 'Int' }, cols: '12', value: 0 },
      moneyTest: { bindings: { 'field-type': 'money', 'label': 'Money', 'helper': 'Money' }, cols: '12', value: 0 },
    },
  },
})

const schemas = {
  things: toTypedSchema(z.object({
    name: z.string({
      required_error: 'Name is required',
    }).min(1, { message: 'Name is required' }),
  })),
  subthings: toTypedSchema(z.object({
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

onMounted(() => {
  if (!route.params.collection) {
    // If making a static collection route, this onMounted should be removed
    router.push('/app/dashboard/things')
  }
})
</script>

<template>
  <div
    v-if="edgeFirebase?.user?.loggedIn"
    class="p-3 w-full h-[calc(100vh-118px)] overflow-y-auto"
  >
    <edge-dashboard v-if="docId === '' && collection !== ''" :filter="state.filter" :collection="collection">
      <template #header-start>
        <LayoutDashboard class="mr-2" />
        <span class="capitalize">{{ collection }}</span>
      </template>
      <template #header-center>
        <div class="w-full px-6">
          <edge-shad-input
            v-model="state.filter"
            label=""
            name="filter"
            placeholder="Filter..."
          />
        </div>
      </template>
      <template #header-end="slotProps">
        <edge-shad-button class="uppercase bg-slate-600" :to="`/app/dashboard/${collection}/new`">
          Add {{ slotProps.title }}
        </edge-shad-button>
      </template>
      <template #list-item="slotProps">
        <edge-shad-button variant="text" class="cursor-pointer w-full flex justify-between slotProps.items-center py-2 gap-3" :to="`/app/dashboard/${collection}/${slotProps.item.docId}`">
          <div>
            <Avatar class="cursor-pointer p-0 h-8 w-8 mr-2">
              <FilePenLine class="h-5 w-5" />
            </Avatar>
          </div>
          <div class="grow text-left">
            <div class="text-lg">
              {{ slotProps.item.name }}
            </div>
          </div>
          <div>
            <edge-shad-button
              size="icon"
              class="bg-slate-600 h-7 w-7"
              @click.stop="slotProps.deleteItem(slotProps.item.docId)"
            >
              <Trash class="h-5 w-5" />
            </edge-shad-button>
          </div>
        </edge-shad-button>
        <Separator class="dark:bg-slate-600" />
      </template>
    </edge-dashboard>
    <edge-editor
      v-else
      :collection="collection"
      :doc-id="docId"
      :schema="schemas[collection]"
      :new-doc-schema="state.newDocs[collection]"
    >
      <template #header-start="slotProps">
        <FilePenLine class="mr-2" />
        {{ slotProps.title }}
      </template>
      <template #header-end="slotProps">
        <edge-shad-button
          v-if="!slotProps.unsavedChanges"
          :to="`/app/dashboard/${collection}`"
          class="bg-red-700 uppercase h-8 hover:bg-slate-400 w-20"
        >
          Close
        </edge-shad-button>
        <edge-shad-button
          v-else
          :to="`/app/dashboard/${collection}`"
          class="bg-red-700 uppercase h-8 hover:bg-slate-400 w-20"
        >
          Cancel
        </edge-shad-button>
        <edge-shad-button
          type="submit"
          class="bg-slate-500 uppercase h-8 hover:bg-slate-400 w-20"
        >
          Save
        </edge-shad-button>
      </template>
      <template #footer="slotProps">
        <div class="flex w-full gap-1 items-center justify-end">
          <edge-shad-button
            v-if="!slotProps.unsavedChanges"
            :to="`/app/dashboard/${collection}`"
            class="bg-red-700 uppercase h-8 hover:bg-slate-400 w-20"
          >
            Close
          </edge-shad-button>
          <edge-shad-button
            v-else
            :to="`/app/dashboard/${collection}`"
            class="bg-red-700 uppercase h-8 hover:bg-slate-400 w-20"
          >
            Cancel
          </edge-shad-button>

          <edge-shad-button
            type="submit"
            class="bg-slate-500 uppercase h-8 hover:bg-slate-400 w-20"
          >
            Save
          </edge-shad-button>
        </div>
      </template>
    </edge-editor>
  </div>
</template>
