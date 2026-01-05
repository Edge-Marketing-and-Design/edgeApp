import { __MODULE_CAMEL__Manifest } from './manifest'

export const __MODULE_CAMEL__RegistryEntry = {
  id: __MODULE_CAMEL__Manifest.id,
  manifest: __MODULE_CAMEL__Manifest,
  navigation: {
    label: '__MODULE_LABEL__',
    route: '__MODULE_ROUTE__',
    icon: 'puzzle',
  },
  adminRoutes: [
    {
      path: '__MODULE_ROUTE__',
      name: '__MODULE_ID__-admin',
      component: '__MODULE_PASCAL__Admin',
    },
  ],
  widgets: [],
}
