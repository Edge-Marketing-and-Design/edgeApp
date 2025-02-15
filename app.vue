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

const currentOrg = computed(() => edgeFirebase.data[`organizations/${edgeGlobal.edgeState.currentOrganization}`])

watch (currentOrg, async () => {
  if (currentOrg.value) {
    edgeGlobal.edgeState = subscribedStatus(currentOrg.value)
  }
}, { immediate: true }, { deep: true })

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
    <div class="flex h-full w-full">
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
            <template #footer="slotProps">
              <Card v-if="slotProps.sideBarState === 'expanded'">
                <CardHeader class="p-2 pt-0 md:p-4">
                  <CardTitle>Upgrade to Pro</CardTitle>
                  <CardDescription>
                    Unlock all features and get unlimited access to our support
                    team.
                  </CardDescription>
                </CardHeader>
                <CardContent class="p-2 pt-0 md:p-4 md:pt-0">
                  <Button size="sm" class="w-full">
                    Upgrade
                  </Button>
                </CardContent>
              </Card>
            </template>
          </edge-side-menu>
        </div>
        <div class="grow h-full flex flex-col h-screen">
          <edge-menu
            v-if="edgeFirebase.user.loggedIn"
            type="nav"
            nav-class="justify-left mr-8"
            :menu-items="menuItems"
          >
            <template #start>
              <SidebarTrigger class="-ml-2 mr-2 h-4 w-4" />
              <Package class="h-6 w-6 mr-2" />
              <h1 class="text-xl font-bold">
                {{ orgName }}
              </h1>
            </template>
          </edge-menu>
          <NuxtPage class="flex-1 flex flex-col overflow-y-auto p-3" keepalive />
          <edge-menu
            v-if="edgeFirebase.user.loggedIn"
            type="footer"
            nav-class="justify-end mr-8"
            :menu-items="menuItems"
          >
            <template #start>
              <div class="text-xs text-muted-foreground">
                Copyright {{ new Date().getFullYear() }}
              </div>
            </template>
          </edge-menu>
        </div>
      </SidebarProvider>
    </div>
  </div>
</template>

<style lang="scss">
.firebase-emulator-warning { display: none; }
html, body {
  overflow: hidden;
}
</style>
