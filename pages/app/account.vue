<script setup>
const edgeFirebase = inject('edgeFirebase')
const isAdmin = computed(() => {
  const orgRole = edgeFirebase?.user?.roles.find(role =>
    role.collectionPath === edgeGlobal.edgeState.organizationDocPath.replaceAll('/', '-'),
  )
  return orgRole && orgRole.role === 'admin'
})

const adminMenuItems = [
  {
    title: 'Organization',
    to: '/app/account/organization-settings',
    icon: 'Settings',
  },
  {
    title: 'Members',
    to: '/app/account/organization-members',
    icon: 'Users',
  },
]

const menuItems = [
  {
    title: 'Profile',
    to: '/app/account/my-profile',
    icon: 'User',
  },
  {
    title: 'Account',
    to: '/app/account/my-account',
    icon: 'CircleUser',
  },
  {
    title: 'Organizations',
    to: '/app/account/my-organizations',
    icon: 'Group',
  },
]
</script>

<template>
  <div
    v-if="edgeGlobal.edgeState.organizationDocPath"
  >
    <div class="h-full p-0">
      <SidebarProvider class="min-h-full">
        <div class="h-full md:w-[180px]">
          <edge-side-menu
            :menu-items="menuItems"
            :settings-menu-items="isAdmin ? adminMenuItems : []"
            collapsible="submenu"
            class="bg-background text-foreground border-none w-[180px] absolute shadow-none"
            :show-settings-section="false"
            title="My Settings"
            settings-title="Organization Settings"
            group-label-classes="text-foreground/70"
          >
            <template #header>
              <h1 class="text-xl">
                Settings
              </h1>
            </template>
          </edge-side-menu>
        </div>
        <NuxtPage class="flex-1 flex flex-col overflow-y-auto p-3" />
      </SidebarProvider>
    </div>
  </div>
</template>

<style lang="scss">
</style>
