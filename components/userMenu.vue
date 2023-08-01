<script setup>
const edgeFirebase = inject('edgeFirebase')
const edgeGlobal = inject('edgeGlobal')
</script>

<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        prepend-icon="mdi-account-group-outline"
        color="primary"
        dark
        v-bind="props"
        variant="plain"
      >
        <template #prepend>
          <v-icon color="secondary" />
        </template>
        {{ edgeGlobal.currentOrganizationObject.name }}
      </v-btn>
    </template>
    <v-card>
      <v-list>
        <v-list-item
          :title="edgeFirebase.user.meta.name"
          :subtitle="edgeFirebase.user.firebaseUser.providerData[0].email"
        >
          <template #prepend>
            <v-avatar>
              <v-icon>
                mdi-account
              </v-icon>
            </v-avatar>
          </template>
          <template #append>
            <v-btn size="small" variant="text" icon="mdi-menu-down" />
          </template>
        </v-list-item>
      </v-list>
      <v-divider />
      <edge-org-switcher />

      <v-divider />

      <v-list :lines="false" density="compact" nav>
        <v-list-item link to="/app/account/organization-settings">
          <v-list-item-title>Manage Account</v-list-item-title>
        </v-list-item>

        <v-list-item link to="/app/account/my-profile">
          <v-list-item-title>My Profile</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-list :lines="false" density="compact" nav>
        <v-list-item @click="logOut(edgeFirebase, edgeGlobal)">
          <v-list-item-title>Log out</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>
