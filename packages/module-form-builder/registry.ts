import { formBuilderManifest } from './manifest'

export const formBuilderRegistryEntry = {
  id: formBuilderManifest.id,
  manifest: formBuilderManifest,
  navigation: {
    label: 'Form Builder',
    route: '/app/dashboard/forms',
    icon: 'clipboard-list',
  },
  adminRoutes: [
    {
      path: '/app/dashboard/forms',
      name: 'form-builder-admin',
      component: 'FormBuilderAdmin',
    },
  ],
  widgets: [
    {
      id: 'form-builder-embed',
      label: 'Form Embed',
    },
  ],
}
