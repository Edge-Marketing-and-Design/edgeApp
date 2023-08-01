<script setup>
const props = defineProps({
  docId: {
    type: String,
    default: '',
  },
  collection: {
    type: String,
    required: true,
  },
  newDocSchema: {
    type: Object,
    required: true,
  },
})

const newDoc = computed(() => {
  return Object.entries(props.newDocSchema).reduce((newObj, [key, val]) => {
    newObj[key] = val.value
    return newObj
  }, {})
})

const router = useRouter()

const state = reactive({
  workingDoc: {},
  form: false,
  tab: 'forms',
  bypassUnsavedChanges: false,
  afterMount: false,
})
const edgeFirebase = inject('edgeFirebase')
const edgeGlobal = inject('edgeGlobal')

const unsavedChanges = computed(() => {
  if (props.docId === 'new') {
    return false
  }
  return JSON.stringify(state.workingDoc) !== JSON.stringify(edgeFirebase.data[`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`][props.docId])
})

const subCollection = (collection) => {
  if (edgeGlobal.objHas(edgeFirebase.data, `${edgeGlobal.edgeState.organizationDocPath}/${collection}`) === false) {
    return []
  }
  // need to return an array of objects title is name and value is docId
  return Object.entries(edgeFirebase.data[`${edgeGlobal.edgeState.organizationDocPath}/${collection}`]).map(([key, val]) => {
    return {
      title: val.name,
      value: key,
    }
  })
}

onBeforeRouteUpdate((to, from, next) => {
  if (unsavedChanges.value && !state.bypassUnsavedChanges) {
    state.dialog = true
    next(false)
    return
  }
  edgeGlobal.edgeState.changeTracker = {}
  next()
})

const discardChanges = async () => {
  if (props.docId === 'new') {
    state.bypassUnsavedChanges = true
    edgeGlobal.edgeState.changeTracker = {}
    router.push('/app/dashboard')
    return
  }
  state.workingDoc = await edgeGlobal.dupObject(edgeFirebase.data[`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`][props.docId])
  state.bypassUnsavedChanges = true
  edgeGlobal.edgeState.changeTracker = {}
  router.push('/app/dashboard')
}

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const singularize = (word) => {
  if (word.endsWith('ies')) {
    return `${word.slice(0, -3)}y`
  }
  else if (word.endsWith('es')) {
    return word.slice(0, -2)
  }
  else if (word.endsWith('s')) {
    return word.slice(0, -1)
  }
  else {
    return word
  }
}

const title = computed(() => {
  if (props.docId !== 'new') {
    if (!edgeFirebase.data[`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`]) {
      return ''
    }
    return capitalizeFirstLetter(`${edgeFirebase.data[`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`][props.docId].name}`)
  }
  else {
    return `New ${capitalizeFirstLetter(singularize(props.collection))}`
  }
})

const onSubmit = async (event) => {
  const results = await event
  if (results.valid) {
    state.bypassUnsavedChanges = true
    edgeFirebase.storeDoc(`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`, state.workingDoc)
    edgeGlobal.edgeState.changeTracker = {}
    router.push(`/app/dashboard/${props.collection}`)
  }
}

onBeforeMount(async () => {
  edgeGlobal.edgeState.changeTracker = {}
  for (const field of Object.keys(props.newDocSchema)) {
    if (props.newDocSchema[field].type === 'collection') {
      await edgeFirebase.startSnapshot(`${edgeGlobal.edgeState.organizationDocPath}/${field}`)
    }
  }
  await edgeFirebase.startSnapshot(`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`)
})

watch(() => edgeFirebase.data[`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`], (newVal) => {
  if (props.docId !== 'new') {
    if (edgeGlobal.objHas(newVal, props.docId) === false) {
      return
    }
    state.workingDoc = edgeGlobal.dupObject(newVal[props.docId])
    Object.keys(newDoc.value).forEach((field) => {
      if (!edgeGlobal.objHas(state.workingDoc, field)) {
        state.workingDoc[field] = newDoc.value[field]
      }
    })
    state.afterMount = true
  }
  else {
    state.workingDoc = edgeGlobal.dupObject(newDoc.value)
    state.afterMount = true
  }
})
</script>

<template>
  <v-card v-if="state.afterMount">
    <v-form
      v-model="state.form"
      validate-on="submit"
      @submit.prevent="onSubmit"
    >
      <v-toolbar flat>
        <v-icon class="mx-4">
          mdi-atom-variant
        </v-icon>

        {{ title }}
        <v-spacer />
        <v-btn
          type="submit"
          color="primary"
          variant="text"
        >
          Save
        </v-btn>
      </v-toolbar>
      <v-card-text>
        <v-row>
          <v-col v-for="(field, name, index) in props.newDocSchema" :key="index" :cols="field.cols">
            <g-input
              v-if="field.type !== 'collection'"
              v-model="state.workingDoc[name]"
              :disable-tracking="props.docId === 'new'"
              :field-type="field.type"
              :rules="[edgeGlobal.edgeRules.required]"
              :label="field.label"
              :parent-tracker-id="`${props.collection}-${props.docId}`"
              :helper="field.helper"
            />
            <g-input
              v-else
              v-model="state.workingDoc[name]"
              :disable-tracking="props.docId === 'new'"
              field-type="select"
              :label="field.label"
              :items="subCollection(name)"
              :parent-tracker-id="`${props.collection}-${props.docId}`"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="!unsavedChanges"
          color="secondary"
          variant="text"
          to="/app/dashboard"
        >
          Close
        </v-btn>
        <v-btn
          v-else
          color="secondary"
          variant="text"
          to="/app/dashboard"
        >
          Cancel
        </v-btn>

        <v-btn
          type="submit"
          color="primary"
          variant="text"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
  <v-dialog v-model="state.dialog" max-width="500px">
    <v-card>
      <v-card-title class="headline">
        Unsaved Changes!
      </v-card-title>
      <v-card-text>
        <h4>"{{ title }}" has unsaved changes.</h4>
        <p>Are you sure you want to discard them?</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="blue darken-1" text @click="state.dialog = false">
          Cancel
        </v-btn>
        <v-btn color="error" text @click="discardChanges()">
          Discard
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>

</style>
