<script setup>
import { useTheme } from 'vuetify'

const vueTheme = useTheme()
const changeTheme = (theme) => {
  vueTheme.global.name.value = theme
}
const edgeFirebase = inject('edgeFirebase')
const edgeGlobal = inject('edgeGlobal')

const currentOrganization = computed(() => {
  return edgeGlobal.edgeState.currentOrganization
})

watch(currentOrganization, async () => {
  if (currentOrganization.value) {
    // RUN STUFF HERE WHEN ORGANIZATION CHANGES LIKE SNAPSHOTS
    await projectSetOrg(currentOrganization.value, edgeFirebase, edgeGlobal)

    // KEEP THIS CODE:
    const auth = useState('auth')
    auth.value = edgeFirebase.user

    const preLoginRoute = useState('preLoginRoute')
    const router = useRouter()

    let cleanedRoute = ''
    if (preLoginRoute.value) {
      cleanedRoute = preLoginRoute.value.endsWith('/') ? preLoginRoute.value.slice(0, -1) : preLoginRoute.value
    }

    if (cleanedRoute === ''
    || cleanedRoute === '/app'
    || cleanedRoute === '/app/login'
    || cleanedRoute === '/app/signup') {
      router.push('/app/dashboard')
    }
    else {
      router.push(preLoginRoute.value)
    }

    console.log(auth.value)
  }
  if (!currentOrganization.value) {
    const auth = useState('auth')
    auth.value = ''
    const router = useRouter()
    router.push('/app/login')
  }
})

const user = computed(() => {
  return edgeFirebase.user
})

watch (user, async () => {
  if (user.value) {
    const auth = useState('auth')
    auth.value = user.value
  }
})

onMounted(() => {
  if (edgeGlobal.isDarkMode()) {
    changeTheme('dark')
  }
  else {
    changeTheme('light')
  }
})
edgeFirebase.runFunction('initFirestore', {})
edgeGlobal.edgeState.userRoles = [
  {
    name: 'Admin',
    roles: [
      {
        collectionPath: 'organizationDocPath',
        role: 'admin',
      },
    ],
  },
  {
    name: 'User',
    roles: [
      {
        collectionPath: 'organizationDocPath',
        role: 'user',
      },
    ],
  },
]
</script>

<template>
  <v-app>
    <top-menu v-if="edgeFirebase.user.loggedIn" />
    <v-main>
      <NuxtPage />
    </v-main>
    <bottom-menu v-if="edgeFirebase.user.loggedIn" />
  </v-app>
</template>

<style lang="scss">
.firebase-emulator-warning { display: none; }
</style>
