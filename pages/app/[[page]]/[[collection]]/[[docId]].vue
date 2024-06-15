<script setup>
const route = useRoute()
// const edgeGlobal = inject('edgeGlobal')

const state = reactive({
  newDocs: {
    things: {
      name: { bindings: { 'field-type': 'text', 'label': 'Name', 'rules': [edgeGlobal.edgeRules.required], 'helper': 'Name' }, cols: '12', value: '' },
      description: { bindings: { 'field-type': 'text', 'label': 'Description', 'rules': [], 'helper': 'Description' }, cols: '12', value: '' },
      subthings: { bindings: { 'field-type': 'collection', 'label': 'Subthings', 'rules': [], 'helper': 'Subthings' }, cols: '12', value: '' },
    },
    subthings: {
      name: { bindings: { 'field-type': 'text', 'rules': [edgeGlobal.edgeRules.required], 'helper': 'Name' }, cols: '12', value: '' },
      test: { bindings: { 'field-type': 'boolean', 'rules': [], 'label': 'Description', 'helper': 'Test' }, cols: '12', value: '' },
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
</script>

<template>
  <v-container
    v-if="edgeGlobal.edgeState.organizationDocPath"
    class="py-8 px-6"
    fluid
  >
    <dashboard v-if="page === 'dashboard' && docId === ''" :collection="collection" />
    <editor v-else-if="page === 'dashboard' && docId !== ''" :collection="collection" :doc-id="docId" :new-doc-schema="state.newDocs[collection]" />
    <account v-else-if="page === 'account'" />
  </v-container>
</template>
