<script setup>
const props = defineProps({
  collection: {
    type: String,
    required: true,
  },
})

const edgeFirebase = inject('edgeFirebase')
// const edgeGlobal = inject('edgeGlobal')
const router = useRouter()

const state = reactive({
  form: false,
  menu: false,
  dialog: false,
  apiKeys: [],
  filter: '',
  empty: false,
  afterMount: false,
  deleteDialog: false,
  deleteItemName: '',
  deleteItemDocId: '',
})

const gotoSite = (docId) => {
  router.push(`/app/dashboard/${props.collection}/${docId}`)
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

const filtered = computed(() => {
  if (edgeGlobal.objHas(edgeFirebase.data, `${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`) === false) {
    return []
  }

  const allData = Object.values(edgeFirebase.data[`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`])

  const filtered = allData.filter((entry) => {
    if (state.filter.trim() === '') {
      return true
    }

    // Modify the condition as needed, e.g., using "startsWith" or "includes"
    return entry.name.toLowerCase().includes(state.filter.toLowerCase())
  })
  return filtered.sort((a, b) => {
    if (a.name < b.name) {
      return -1
    }
    if (a.name > b.name) {
      return 1
    }
    return 0
  })
})

onBeforeMount (async () => {
  await edgeFirebase.startSnapshot(`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`)
  state.afterMount = true
})

const deleteItem = (docId) => {
  state.deleteDialog = true
  state.deleteItemName = edgeFirebase.data[`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`][docId].name
  state.deleteItemDocId = docId
}

const deleteAction = () => {
  edgeFirebase.removeDoc(`${edgeGlobal.edgeState.organizationDocPath}/${props.collection}`, state.deleteItemDocId)
  state.deleteDialog = false
}
</script>

<template>
  <edge-v-card v-if="state.afterMount" class="mx-auto bg-muted/50" max-width="1200">
    <edge-menu class="py-9">
      <template #start>
        <Box class="mr-2" />
        {{ capitalizeFirstLetter(props.collection) }}
      </template>
      <template #center>
        <div class="w-full px-6">
          <edge-shad-input
            v-model="state.filter"
            label=""
            name="filter"
            placeholder="Search..."
          />
        </div>
      </template>
      <template #end>
        <edge-shad-button class="uppercase bg-slate-600" :to="`/app/dashboard/${props.collection}/new`">
          Add {{ singularize(props.collection) }}
        </edge-shad-button>
      </template>
    </edge-menu>
    <edge-v-card-text>
      <edge-v-list lines="two">
        <template v-for="item in filtered" :key="item.docId">
          <edge-v-list-item class="cursor-pointer" @click="gotoSite(item.docId)">
            <template #prepend>
              <Avatar class="cursor-pointer p-0 h-8 w-8 mr-2">
                <FilePenLine class="h-5 w-5" />
              </Avatar>
            </template>

            <edge-v-list-item-title>{{ item.name }}</edge-v-list-item-title>
            <template #append>
              <edge-shad-button
                size="icon"
                class="bg-slate-600 h-7 w-7"
                @click.stop="deleteItem(item.docId)"
              >
                <Trash class="h-5 w-5" />
              </edge-shad-button>
            </template>
          </edge-v-list-item>
          <Separator class="dark:bg-slate-600" />
        </template>
      </edge-v-list>
    </edge-v-card-text>
    <edge-shad-dialog
      v-model="state.deleteDialog"
    >
      <DialogContent class="pt-10">
        <DialogHeader>
          <DialogTitle class="text-left">
            Are you sure you want to delete "{{ state.deleteItemName }}"?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. {{ state.deleteItemName }} will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="pt-2 flex justify-between">
          <edge-shad-button class="text-white bg-slate-800 hover:bg-slate-400" @click="state.deleteDialog = false">
            Cancel
          </edge-shad-button>
          <edge-shad-button variant="destructive" class="text-white w-full" @click="deleteAction()">
            Delete
          </edge-shad-button>
        </DialogFooter>
      </DialogContent>
    </edge-shad-dialog>
  </edge-v-card>
</template>

<style lang="scss" scoped>

</style>
