import { __MODULE_CAMEL__ConfigDefaults, __MODULE_CAMEL__ConfigSchema } from './schema/config'
import { install__MODULE_PASCAL__Module, uninstall__MODULE_PASCAL__Module, upgrade__MODULE_PASCAL__Module } from './server/lifecycle'
import { __MODULE_CAMEL__Paths } from './data/paths'

export const __MODULE_CAMEL__Manifest = {
  id: '__MODULE_ID__',
  version: '__MODULE_VERSION__',
  scope: ['tenant', 'site'],
  compatibility: {
    platform: '>=1.0.0 <2.0.0',
  },
  permissions: ['__MODULE_ID__:read', '__MODULE_ID__:write'],
  data: {
    collections: [],
  },
  lifecycle: {
    install: install__MODULE_PASCAL__Module,
    upgrade: upgrade__MODULE_PASCAL__Module,
    uninstall: uninstall__MODULE_PASCAL__Module,
  },
}

export const __MODULE_CAMEL__Config = {
  schema: __MODULE_CAMEL__ConfigSchema,
  defaults: __MODULE_CAMEL__ConfigDefaults,
  paths: __MODULE_CAMEL__Paths,
}
