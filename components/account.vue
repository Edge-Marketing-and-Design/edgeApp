<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
// const edgeGlobal = inject('edgeGlobal')
const site = computed(() => {
  return route.params.collection
})
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
</script>

<template>
  <v-card :rounded="0">
    <sub-toolbar>
      <v-icon class="mx-4">
        mdi-account
      </v-icon>
      Account Settings
    </sub-toolbar>
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="3" class="d-none d-sm-block">
          <!-- Desktop sidebar -->
          <v-card>
            <v-list :lines="false" density="compact" nav>
              <v-list-subheader class="">
                Organization
              </v-list-subheader>
              <v-list-item link to="/app/account/organization-settings">
                <v-list-item-title>Settings</v-list-item-title>
              </v-list-item>

              <v-list-item link to="/app/account/organization-members">
                <v-list-item-title>Members</v-list-item-title>
              </v-list-item>
            </v-list>
            <Separator class="dark:bg-slate-600" />
            <v-list :lines="false" density="compact" nav>
              <v-list-subheader class="">
                My Settings
              </v-list-subheader>
              <v-list-item link to="/app/account/my-profile">
                <v-list-item-title>Profile</v-list-item-title>
              </v-list-item>

              <v-list-item link to="/app/account/my-account">
                <v-list-item-title>Account</v-list-item-title>
              </v-list-item>
              <v-list-item link to="/app/account/my-organizations">
                <v-list-item-title>Organizations</v-list-item-title>
              </v-list-item>
            </v-list>

            <Separator class="dark:bg-slate-600" />
          </v-card>
        </v-col>
        <v-col cols="12" sm="9">
          <!-- Mobile tabs -->
          <v-tabs v-model="site" center-active show-arrows class="d-sm-none">
            <v-tab key="org-settings" value="org-settings" to="/app/account/organization-settings">
              Org Settings
            </v-tab>
            <v-tab key="org-members" value="org-members" to="/app/account/organization-members">
              Org Members
            </v-tab>
            <v-tab key="my-profile" value="my-profile" to="/app/account/my-profile">
              Profile
            </v-tab>
            <v-tab key="my-account" value="my-account" to="/app/account/my-account">
              Account
            </v-tab>
            <v-tab key="my-organizations" value="my-organizations" to="/app/account/my-organizations">
              Organizations
            </v-tab>
          </v-tabs>
          <!-- Content -->
          <edge-organization-settings v-if="site === 'organization-settings'" :org-fields="orgFields" />
          <edge-my-account v-if="site === 'my-account'" />
          <edge-my-profile v-if="site === 'my-profile'" :meta-fields="metaFields" />
          <edge-organization-members v-if="site === 'organization-members'" />
          <edge-my-organizations v-if="site === 'my-organizations'" :registration-code="config.public.registrationCode" />
          <billing v-if="site === 'subscription'" />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
