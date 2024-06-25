<script setup>
import {
  CircleUser,
  Group,
  Settings,
  User,
  Users,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
// const edgeGlobal = inject('edgeGlobal')
const site = ref('')

const metaFields = [
  {
    field: 'name',
    type: 'text',
    label: 'Name',
    hint: 'Your name, shown in the user interface.',
    rules: [edgeGlobal.edgeRules.required],
  },
]
const orgFields = [
  {
    field: 'name',
    type: 'text',
    label: 'Name',
    hint: 'Your name, shown in the user interface.',
    rules: [edgeGlobal.edgeRules.required],
  },
]

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
    <div class="w-1/6  hidden md:block">
      <Command v-model="site" class="rounded-lg border max-h-[300px] px-1">
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Organization">
            <CommandItem
              value="organization-settings"
              class="cursor-pointer"
              :class="{ 'bg-slate-400': site === 'organization-settings' }"
            >
              <Settings class="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
            <CommandItem
              value="organization-members"
              class="cursor-pointer"
              :class="{ 'bg-slate-400': site === 'organization-members' }"
            >
              <Users class="mr-2 h-4 w-4" />
              <span>Members</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="My Settings">
            <CommandItem
              value="my-profile"
              class="cursor-pointer"
              :class="{ 'bg-slate-400': site === 'my-profile' }"
            >
              <User class="mr-2 h-4 w-4" />
              <span>Profile</span>
            </CommandItem>
            <CommandItem
              value="my-account"
              class="cursor-pointer"
              :class="{ 'bg-slate-400': site === 'my-account' }"
            >
              <CircleUser class="mr-2 h-4 w-4" />
              <span>Account</span>
            </CommandItem>
            <CommandItem
              value="my-organizations"
              class="cursor-pointer"
              :class="{ 'bg-slate-400': site === 'my-organizations' }"
            >
              <Group class="mr-2 h-4 w-4" />
              <span>Organizations</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
    <Card class="grow h-full bg-muted/50">
      <edge-organization-settings v-if="site === 'organization-settings'" :org-fields="orgFields" />
      <edge-my-account v-if="site === 'my-account'" />
      <edge-my-profile v-if="site === 'my-profile'" :meta-fields="metaFields" />
      <edge-organization-members v-if="site === 'organization-members'" />
      <edge-my-organizations v-if="site === 'my-organizations'" :registration-code="config.public.registrationCode" />
      <billing v-if="site === 'subscription'" />
    </Card>
  </div>
</template>
