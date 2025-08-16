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
    v-if="edgeGlobal.edgeState.organizationDocPath"
    class="w-full max-w-7xl mx-auto  bg-white rounded-[9.96px] shadow-md px-6"
  >
    <edge-organization-settings
      v-if="page === 'organization-settings'"
      :subscribe-options="subscribeOptions"
      :form-schema="orgSchema"
      :org-fields="orgFields"
      class="bg-white"
    >
      <template #header>
        <Teleport to="#page-header">
          <edge-shad-breadcrumbs
            :items="[
              { text: 'Settings', to: '/app/dashboard/my-profile' },
              { text: 'Organization', to: '' },
            ]"
          />
        </Teleport>
      </template>
    </edge-organization-settings>
    <edge-my-account
      v-if="page === 'my-account'"
      class="bg-white"
    >
      <template #header>
        <Teleport to="#page-header">
          <edge-shad-breadcrumbs
            :items="[
              { text: 'Settings', to: '/app/dashboard/my-profile' },
              { text: 'My Account', to: '' },
            ]"
          />
        </Teleport>
      </template>
    </edge-my-account>
    <edge-my-profile
      v-if="page === 'my-profile'"
      :form-schema="metaSchema"
      :meta-fields="metaFields"
      class="bg-white"
    >
      <template #header>
        <Teleport to="#page-header">
          <edge-shad-breadcrumbs
            :items="[
              { text: 'Settings', to: '/app/dashboard/my-profile' },
              { text: 'My Profile', to: '' },
            ]"
          />
        </Teleport>
      </template>
    </edge-my-profile>
    <edge-organization-members
      v-if="page === 'organization-members'"
      class="bg-white"
    >
      <template #header>
        <Teleport to="#page-header">
          <edge-shad-breadcrumbs
            :items="[
              { text: 'Settings', to: '/app/dashboard/my-profile' },
              { text: 'Users', to: '' },
            ]"
          />
        </Teleport>
      </template>
    </edge-organization-members>
    <edge-my-organizations
      v-if="page === 'my-organizations'"
      :registration-code="config.public.registrationCode"
      class="bg-white"
    >
      <template #header>
        <Teleport to="#page-header">
          <edge-shad-breadcrumbs
            :items="[
              { text: 'Settings', to: '/app/dashboard/my-profile' },
              { text: 'My Organizations', to: '' },
            ]"
          />
        </Teleport>
      </template>
    </edge-my-organizations>
    <edge-billing
      v-if="page === 'subscription'"
    />
  </div>
</template>
