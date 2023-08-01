<script setup>
const props = defineProps({
  collection: {
    type: String,
    required: true,
  },
})

const edgeFirebase = inject('edgeFirebase')
const edgeGlobal = inject('edgeGlobal')
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
  <v-card v-if="state.afterMount">
    <v-toolbar flat>
      <v-toolbar-title>{{ capitalizeFirstLetter(props.collection) }}</v-toolbar-title>
      <v-text-field
        v-model="state.filter"
        label="Filter"
        prepend-icon="mdi-filter"
        variant="underlined"
        hide-details
        clearable
        @click:clear="state.filter = ''"
      />
      <v-spacer />
      <v-btn variant="outlined" :to="`/app/dashboard/${props.collection}/new`">
        Add {{ singularize(props.collection) }}
      </v-btn>
    </v-toolbar>
    <v-card-text>
      <v-list lines="two">
        <template v-for="item in filtered" :key="item.docId">
          <v-list-item @click="gotoSite(item.docId)">
            <template #prepend>
              <v-avatar color="grey-darken-1">
                <v-icon>mdi-file-edit</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title>{{ item.name }}</v-list-item-title>
            <template #append>
              <v-btn
                color="grey-lighten-1"
                icon="mdi-delete"
                variant="text"
                @click.stop="deleteItem(item.docId)"
              />
            </template>
          </v-list-item>
          <v-divider
            inset
          />
        </template>
      </v-list>
    </v-card-text>
    <v-dialog
      v-model="state.deleteDialog"
      persistent
      max-width="600"
      transition="fade-transition"
    >
      <v-card>
        <v-toolbar flat>
          <v-icon class="mx-4">
            mdi-list-box
          </v-icon>
          Delete
          <v-spacer />

          <v-btn
            type="submit"
            color="primary"
            icon
            @click="state.deleteDialog = false"
          >
            <v-icon> mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-title>Are you sure you want to delete "{{ state.deleteItemName }}"?</v-card-title>
        <v-card-text>Hey there, you're about to banish "{{ state.deleteItemName }}" into the endless abyss of deletion, never to be seen again. Remember, this is not just another trashy reality TV show - there are no sudden comebacks or surprise twists. Once it's gone, it's gone, just like the dignity of anyone who wears socks with sandals. Are you 100% sure you're ready to make ""{{ state.deleteItemName }}"" disappear like a magician's assistant? Tick-tock, the choice is yours!</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="state.deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            type="submit"
            color="error"
            variant="text"
            @click="deleteAction()"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style lang="scss" scoped>

</style>
