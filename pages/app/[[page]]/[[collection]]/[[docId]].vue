<script setup>
const route = useRoute()
const router = useRouter()
// const edgeGlobal = inject('edgeGlobal')

const state = reactive({
  newDocs: {
    things: {
      name: { bindings: { 'field-type': 'text', 'label': 'Name', 'helper': 'Name' }, cols: '12', value: '' },
      description: { bindings: { 'field-type': 'text', 'label': 'Description', 'helper': 'Description' }, cols: '12', value: '' },
      subthings: { bindings: { 'field-type': 'collection', 'label': 'Subthings', 'helper': 'Subthings', 'collection-path': 'subthings' }, cols: '12', value: '' },
    },
    subthings: {
      name: { bindings: { 'field-type': 'text', 'label': 'Name', 'helper': 'Name' }, cols: '12', value: '' },
      test: { bindings: { 'field-type': 'boolean', 'label': 'Description', 'helper': 'Test' }, cols: '12', value: '' },
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

const page = computed(() => {
  return route.params.page
})
const collection = computed(() => {
  if (route.params.collection) {
    return route.params.collection
  }
  return 'things'
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
    router.push('/app/dashboard/things')
  }
})
</script>

<template>
  <div
    v-if="edgeGlobal.edgeState.organizationDocPath"
    class="p-3 w-full h-[calc(100vh-118px)] overflow-y-auto"
  >
    <dashboard v-if="page === 'dashboard' && docId === ''" :collection="collection" />
    <editor v-else-if="page === 'dashboard' && docId !== ''" :collection="collection" :doc-id="docId" :new-doc-schema="state.newDocs[collection]" />
    <account v-else-if="page === 'account'" />
  </div>
</template>
