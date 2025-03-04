<script setup>
const edgeFirebase = inject('edgeFirebase')
// const edgeGlobal = inject('edgeGlobal')

const route = useRoute()

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
})

const showLeftPanel = computed(() => {
  return edgeGlobal?.edgeState?.showLeftPanel[route.path]
})

const leftPanelDefaultSize = computed(() => {
  if (showLeftPanel.value) {
    return 20
  }
  return 0
})

const mainPanelDefaultSize = computed(() => {
  if (showLeftPanel.value) {
    return 80
  }
  return 100
})

const leftPanel = ref(null)
const mainPanel = ref(null)

watch(showLeftPanel, (value) => {
  if (leftPanel.value && mainPanel.value) {
    const animateResize = (panel, targetSize) => {
      let currentSize = panel.value.getSize()
      const step = (targetSize - currentSize) / 10 // Smooth out the transition

      const animate = () => {
        if (Math.abs(currentSize - targetSize) > 0.5) {
          currentSize += step
          panel.value.resize(currentSize)
          requestAnimationFrame(animate)
        }
        else {
          panel.value.resize(targetSize)
        }
      }

      animate()
    }

    if (value) {
      animateResize(leftPanel, 20)
      animateResize(mainPanel, 80)
    }
    else {
      animateResize(leftPanel, 0)
      animateResize(mainPanel, 100)
    }
  }
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
  <Head>
    <title>Edge App</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
  </Head>
  <Toaster />
  <div class="flex flex-col h-[calc(100vh+200px)]">
    <div class="flex h-full w-full fixed">
      <edge-sidebar-provider
        v-slot="sideBarProviderProps"
        enable-nested-menu
        collapsible="slack"
      >
        <div class="h-full">
          <edge-side-bar
            v-if="edgeFirebase.user.loggedIn"
            :menu-items="menuItems"
            :collapsible="sideBarProviderProps.collapsible"
            class="border-solid border-r"
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
          </edge-side-bar>
        </div>
        <ResizablePanelGroup
          direction="horizontal"
          class="h-full w-full"
        >
          <ResizablePanel ref="leftPanel" class="bg-sidebar text-sidebar-foreground" :default-size="leftPanelDefaultSize">
            <div id="left-panel" />
          </ResizablePanel>
          <ResizableHandle v-if="showLeftPanel" with-handle />
          <ResizablePanel ref="mainPanel" :default-size="mainPanelDefaultSize">
            <div class="grow h-full flex flex-col h-screen">
              <edge-menu
                v-if="edgeFirebase.user.loggedIn"
                type="nav"
                nav-class="justify-left"
                class="px-1 border-none"
              >
                <template #start>
                  <edge-shad-button
                    v-show="edgeGlobal.edgeState.sidebar.isMobile"
                    variant="icon"
                    class="p-1"
                    @click="edgeGlobal.edgeState.sidebar.toggleSidebar"
                  >
                    <MenuSquare />
                  </edge-shad-button>
                </template>
              </edge-menu>
              <NuxtPage class="flex-1 flex flex-col overflow-y-auto p-3 pt-0" />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </edge-sidebar-provider>
    </div>
  </div>
</template>

<style lang="scss">
.firebase-emulator-warning { display: none; }
html {
  scrollbar-width: none;
}

html::-webkit-scrollbar {
  display: none;
}
</style>
