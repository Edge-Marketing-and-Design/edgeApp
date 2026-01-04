import { formBuilderConfigDefaults, formBuilderConfigSchema } from './schema/config'
import { installFormBuilderModule, uninstallFormBuilderModule, upgradeFormBuilderModule } from './server/lifecycle'
import { formBuilderPaths } from './data/paths'

export const formBuilderManifest = {
  id: 'form-builder',
  version: '0.2.0',
  scope: ['tenant', 'site'],
  compatibility: {
    platform: '>=1.0.0 <2.0.0',
  },
  permissions: ['forms:read', 'forms:write', 'forms:publish'],
  data: {
    collections: ['forms', 'formVersions', 'formSubmissions', 'formIntegrationJobs'],
  },
  lifecycle: {
    install: installFormBuilderModule,
    upgrade: upgradeFormBuilderModule,
    uninstall: uninstallFormBuilderModule,
  },
}

export const formBuilderConfig = {
  schema: formBuilderConfigSchema,
  defaults: formBuilderConfigDefaults,
  paths: formBuilderPaths,
}
