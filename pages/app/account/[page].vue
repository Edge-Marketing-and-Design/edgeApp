<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
const route = useRoute()
const router = useRouter()
const edgeFirebase = inject('edgeFirebase')
// const edgeGlobal = inject('edgeGlobal')
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

definePageMeta({
  middleware: 'auth',
})

onMounted(() => {
  if (!route.params.page) {
    // router.push('/app/account/my-account')
  }
})

const page = computed(() => {
  return route.params.page
})
</script>

<template>
  <div
    v-if="edgeFirebase?.user?.loggedIn"
    class="p-3 w-full h-[calc(100vh-118px)] overflow-y-auto"
  >
    <div class="gap-2 h-full w-full justify-items-center">
      <Card class="w-full h-full bg-muted/50 max-w-7xl m-auto pt-3">
        <edge-organization-settings v-if="page === 'organization-settings'" :form-schema="orgSchema" :org-fields="orgFields" />
        <edge-my-account v-if="page === 'my-account'" />
        <edge-my-profile v-if="page === 'my-profile'" :form-schema="metaSchema" :meta-fields="metaFields" />
        <edge-organization-members v-if="page === 'organization-members'" />
        <edge-my-organizations v-if="page === 'my-organizations'" :registration-code="config.public.registrationCode" />
        <edge-billing v-if="page === 'subscription'" />
      </Card>
    </div>
  </div>
</template>
