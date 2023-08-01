<script setup>
const route = useRoute()
const edgeGlobal = inject('edgeGlobal')
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
  <v-card>
    <v-toolbar flat>
      <v-icon class="mx-4">
        mdi-account-group-outline
      </v-icon>
      {{ edgeGlobal.currentOrganizationObject.name }}
    </v-toolbar>
    <v-card-text>
      <v-row>
        <v-col cols="3">
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
            <v-divider />

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

            <v-divider />
          </v-card>
        </v-col>
        <v-col cols="9">
          <edge-organization-settings v-if="site === 'organization-settings'" :org-fields="orgFields" />
          <edge-my-account v-if="site === 'my-account'" />
          <edge-my-profile v-if="site === 'my-profile'" :meta-fields="metaFields" />
          <edge-organization-members v-if="site === 'organization-members'" />
          <edge-my-organizations v-if="site === 'my-organizations'" :registration-code="config.public.registrationCode" />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
