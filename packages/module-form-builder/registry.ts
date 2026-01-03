import { formBuilderManifest } from './manifest'

export const formBuilderRegistryEntry = {
  id: formBuilderManifest.id,
  manifest: formBuilderManifest,
  navigation: {
    label: 'Form Builder',
    route: '/admin/forms',
    icon: 'clipboard-list',
  },
  adminRoutes: [
    {
      path: '/admin/forms',
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
