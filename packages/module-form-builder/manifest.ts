import { formBuilderConfigDefaults, formBuilderConfigSchema } from './schema/config'
import type { ModuleScope } from './runtime/types'
import { installFormBuilderModule, uninstallFormBuilderModule, upgradeFormBuilderModule } from './server/lifecycle'
import { formBuilderPaths } from './data/paths'

export const formBuilderManifest = {
  id: 'form-builder',
  version: '0.1.0',
  scope: 'site' as ModuleScope,
  permissions: ['forms:read', 'forms:write', 'forms:publish'],
  configSchema: formBuilderConfigSchema,
  configDefaults: formBuilderConfigDefaults,
  dataPaths: formBuilderPaths,
  hooks: {
    install: installFormBuilderModule,
    upgrade: upgradeFormBuilderModule,
    uninstall: uninstallFormBuilderModule,
  },
}
