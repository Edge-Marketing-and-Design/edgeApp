import { __MODULE_CAMEL__ConfigDefaults } from '../schema/config'
import { __MODULE_PASCAL__Migrations } from '../migrations'
import type { ModuleInstallContext, ModuleUpgradeContext, ModuleUninstallContext } from '../runtime/types'

export async function install__MODULE_PASCAL__Module(context: ModuleInstallContext) {
  const { db, orgId, siteId, now, logger } = context
  await db.doc(`organizations/${orgId}/modules/__MODULE_ID__`).set({
    id: '__MODULE_ID__',
    installedVersion: '__MODULE_VERSION__',
    enabled: true,
    installedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }, { merge: true })

  await db.doc(`organizations/${orgId}/sites/${siteId}/modules/__MODULE_ID__`).set({
    config: __MODULE_CAMEL__ConfigDefaults,
    updatedAt: now.toISOString(),
  }, { merge: true })

  logger?.info('Installed __MODULE_ID__ module', { orgId, siteId })
}

export async function upgrade__MODULE_PASCAL__Module(context: ModuleUpgradeContext) {
  const { fromVersion, toVersion, logger } = context
  for (const migration of __MODULE_PASCAL__Migrations) {
    logger?.info('Running __MODULE_ID__ migration', { id: migration.id, fromVersion, toVersion })
    await migration.run({
      db: context.db,
      orgId: context.orgId,
      siteId: context.siteId,
      now: context.now,
    })
  }
}

export async function uninstall__MODULE_PASCAL__Module(context: ModuleUninstallContext) {
  const { db, orgId, siteId, now, logger } = context
  await db.doc(`organizations/${orgId}/modules/__MODULE_ID__`).set({
    enabled: false,
    uninstalledAt: now.toISOString(),
  }, { merge: true })

  await db.doc(`organizations/${orgId}/sites/${siteId}/modules/__MODULE_ID__`).set({
    disabledAt: now.toISOString(),
  }, { merge: true })

  logger?.info('Disabled __MODULE_ID__ module', { orgId, siteId })
}
