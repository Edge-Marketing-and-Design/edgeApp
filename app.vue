<script setup>
// TODO : ADD CODE FOR NOTIFICATIONS AND DEEP LINKING
// import { useTheme } from 'vuetify'
// const vueTheme = useTheme()
// const changeTheme = (theme) => {
//   vueTheme.global.name.value = theme
// }
const edgeFirebase = inject('edgeFirebase')
// const edgeGlobal = inject('edgeGlobal')

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

const orgName = computed(() => {
  const org = edgeGlobal.edgeState.organizations.find(org => org.docId === edgeGlobal.edgeState.currentOrganization)
  return org?.name
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
const colorMode = useColorMode()
onMounted(() => {
  colorMode.preference = 'system'
  // if (edgeGlobal.isDarkMode()) {
  //   changeTheme('dark')
  // }
  // else {
  //   changeTheme('light')
  // }
})
edgeFirebase.runFunction('edgeFirebase-initFirestore', {})
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

const menuItems = [
  {
    title: 'Dashboard',
    to: '/app/dashboard/things',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Sub Things',
    to: '/app/dashboard/subthings',
    icon: 'Package',
  },
]
</script>

<template>
  <Toaster />
  <div class="flex flex-col h-screen">
    <!-- <edge-menu v-if="edgeFirebase.user.loggedIn" type="header" nav-class="justify-start" class="bg-slate-300 dark:bg-slate-900" :menu-items="menuItems">
      <template #start>
        <Package class="h-6 w-6 mr-2" />
        <h1 class="text-xl font-bold">
          {{ orgName }}
        </h1>
      </template>
    </edge-menu> -->
    <div class="flex h-full">
      <SidebarProvider>
        <div class="h-full">
          <edge-side-menu
            v-if="edgeFirebase.user.loggedIn"
            :menu-items="menuItems"
          >
            <template #header>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton style="padding-left: 4px !important;">
                    <Package class="!h-6 !w-6" /> <span class="text-xl">{{ orgName }}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </template>
          </edge-side-menu>
        </div>
        <div class="grow h-full">
          <div class="flex justify-between p-1">
            <div>
              <SidebarTrigger />
            </div>
            <div>
              <edge-user-menu :title="orgName" button-class="w-8 h-8 bg-secondary" icon-class="w-6 h-6" />
            </div>
          </div>
          <NuxtPage keepalive />
        </div>
      </SidebarProvider>
    </div>
    <!-- <edge-menu
      v-if="edgeFirebase.user.loggedIn"
      type="footer"
      button-class="text-slate-500"
      nav-class="justify-end mr-8"
      class="bg-slate-800"
      :menu-items="menuItems"
    >
      <template #start>
        <div class="text-xs text-muted-foreground">
          Copyright {{ new Date().getFullYear() }}
        </div>
      </template>
    </edge-menu> -->
  </div>
</template>

<style lang="scss">
.firebase-emulator-warning { display: none; }
html, body {
  overflow: hidden;
}
</style>
