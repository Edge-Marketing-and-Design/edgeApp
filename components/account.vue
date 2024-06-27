<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
const route = useRoute()
const router = useRouter()
// const edgeGlobal = inject('edgeGlobal')
const edgeFirebase = inject('edgeFirebase')
const isAdmin = computed(() => {
  const orgRole = edgeFirebase?.user?.roles.find(role =>
    role.collectionPath === edgeGlobal.edgeState.organizationDocPath.replaceAll('/', '-'),
  )

  return orgRole && orgRole.role === 'admin'
})

const site = ref('')

const metaFields = [
  {
    field: 'name',
    type: 'text',
    label: 'Name',
    hint: 'Your name, shown in the user interface.',
    value: '',
  },
]
const orgFields = [
  {
    field: 'name',
    type: 'text',
    label: 'Name',
    hint: '',
    value: '',
  },
]

const orgSchema = toTypedSchema(z.object({
  name: z.string({
    required_error: 'Name is required',
  }).min(1, { message: 'Name is required' }),
}))

const metaSchema = toTypedSchema(z.object({
  name: z.string({
    required_error: 'Name is required',
  }).min(1, { message: 'Name is required' }),
}))

const config = useRuntimeConfig()

const state = reactive({
  currentValue: '',
})

onBeforeMount(() => {
  site.value = route.params.collection
})
</script>

<template>
  <div class="flex gap-2 h-full">
    <Card class="grow h-full bg-muted/50">
      <edge-organization-settings v-if="site === 'organization-settings'" :form-schema="orgSchema" :org-fields="orgFields" />
      <edge-my-account v-if="site === 'my-account'" />
      <edge-my-profile v-if="site === 'my-profile'" :meta-fields="metaFields" />
      <edge-organization-members v-if="site === 'organization-members'" />
      <edge-my-organizations v-if="site === 'my-organizations'" :registration-code="config.public.registrationCode" />
      <billing v-if="site === 'subscription'" />
    </Card>
  </div>
</template>
