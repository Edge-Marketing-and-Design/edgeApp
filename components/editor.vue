<script setup>
// TODO: CREATE DASHBOARD AND EDITOR COMPONENTS
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
  schema: {
    type: Object,
    required: false,
    default: () => ({}),
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
// const edgeGlobal = inject('edgeGlobal')

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
    router.push(`/app/dashboard/${props.collection}`)
    return
  }
  state.workingDoc = await edgeGlobal.dupObject(edgeFirebase.data[`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`][props.docId])
  state.bypassUnsavedChanges = true
  edgeGlobal.edgeState.changeTracker = {}
  router.push(`/app/dashboard/${props.collection}`)
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

const onSubmit = async () => {
  state.bypassUnsavedChanges = true
  edgeFirebase.storeDoc(`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`, state.workingDoc)
  edgeGlobal.edgeState.changeTracker = {}
  router.push(`/app/dashboard/${props.collection}`)
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
  <edge-v-card v-if="state.afterMount" class="m-auto bg-muted/50" max-width="1200">
    <edge-shad-form
      v-model="state.form"
      :schema="props.schema"
      @submit.prevent="onSubmit"
    >
      <edge-menu>
        <template #start>
          <FilePenLine class="mr-2" />
          {{ title }}
        </template>
        <template #end>
          <edge-shad-button
            v-if="!unsavedChanges"
            :to="`/app/dashboard/${props.collection}`"
            class="uppercase h-8 hover:bg-slate-400 w-20"
            variant="destructive"
          >
            Close
          </edge-shad-button>
          <edge-shad-button
            v-else
            :to="`/app/dashboard/${props.collection}`"
            class="uppercase h-8 hover:bg-slate-400 w-20"
            variant="destructive"
          >
            Cancel
          </edge-shad-button>
          <edge-shad-button
            type="submit"
            class="bg-slate-500  uppercase h-8 hover:bg-slate-400 w-20"
          >
            Save
          </edge-shad-button>
        </template>
      </edge-menu>
      <edge-v-card-text>
        <edge-v-row>
          <edge-v-col v-for="(field, name, index) in props.newDocSchema" :key="index" :cols="field.cols">
            <edge-g-input
              v-if="field.bindings['field-type'] !== 'collection'"
              v-model="state.workingDoc[name]"
              :name="name"
              :disable-tracking="props.docId === 'new'"
              :parent-tracker-id="`${props.collection}-${props.docId}`"
              v-bind="field.bindings"
            />
            <edge-g-input
              v-else
              v-model="state.workingDoc[name]"
              :disable-tracking="props.docId === 'new'"
              field-type="collection"
              :collection-path="`${edgeGlobal.edgeState.organizationDocPath}/${field.bindings['collection-path']}`"
              :label="field.bindings.label"
              :name="name"
              :parent-tracker-id="`${props.collection}-${props.docId}`"
            />
          </edge-v-col>
        </edge-v-row>
      </edge-v-card-text>
      <edge-v-card-actions>
        <edge-shad-button
          v-if="!unsavedChanges"
          :to="`/app/dashboard/${props.collection}`"
          class="uppercase h-8 hover:bg-slate-400 w-20"
          variant="destructive"
        >
          Close
        </edge-shad-button>
        <edge-shad-button
          v-else
          :to="`/app/dashboard/${props.collection}`"
          class="uppercase h-8 hover:bg-slate-400 w-20"
          variant="destructive"
        >
          Cancel
        </edge-shad-button>

        <edge-shad-button
          type="submit"
          class="bg-slate-500  uppercase h-8 hover:bg-slate-400 w-20"
        >
          Save
        </edge-shad-button>
      </edge-v-card-actions>
    </edge-shad-form>
  </edge-v-card>
  <edge-shad-dialog v-model="state.dialog" max-width="500px">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Unsaved Changes!
        </DialogTitle>
        <DialogDescription>
          <h4>"{{ title }}" has unsaved changes.</h4>
          <p>Are you sure you want to discard them?</p>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="pt-2 flex justify-between">
        <edge-shad-button class="text-white bg-slate-800 hover:bg-slate-400" @click="state.dialog = false">
          Cancel
        </edge-shad-button>
        <edge-shad-button variant="destructive" class="text-white w-full" @click="discardChanges()">
          Discard
        </edge-shad-button>
      </DialogFooter>
    </DialogContent>
  </edge-shad-dialog>
</template>

<style lang="scss" scoped>

</style>
