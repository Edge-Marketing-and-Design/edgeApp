import { formBuilderConfigDefaults } from '../schema/config'
import { formBuilderMigrations } from '../migrations'
import type { ModuleInstallContext, ModuleUpgradeContext, ModuleUninstallContext } from '../runtime/types'

export async function installFormBuilderModule(context: ModuleInstallContext) {
  const { db, tenantId, siteId, now, logger } = context
  await db.doc(`tenants/${tenantId}/modules/form-builder`).set({
    id: 'form-builder',
    installedVersion: '0.1.0',
    enabled: true,
    installedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }, { merge: true })

  await db.doc(`tenants/${tenantId}/sites/${siteId}/modules/form-builder`).set({
    config: formBuilderConfigDefaults,
    updatedAt: now.toISOString(),
  }, { merge: true })

  logger?.info('Installed form builder module', { tenantId, siteId })
}

export async function upgradeFormBuilderModule(context: ModuleUpgradeContext) {
  const { fromVersion, toVersion, logger } = context
  for (const migration of formBuilderMigrations) {
    logger?.info('Running form builder migration', { id: migration.id, fromVersion, toVersion })
    await migration.run({
      db: context.db,
      tenantId: context.tenantId,
      siteId: context.siteId,
      now: context.now,
    })
  }
}

export async function uninstallFormBuilderModule(context: ModuleUninstallContext) {
  const { db, tenantId, siteId, now, logger } = context
  await db.doc(`tenants/${tenantId}/modules/form-builder`).set({
    enabled: false,
    uninstalledAt: now.toISOString(),
  }, { merge: true })

  await db.doc(`tenants/${tenantId}/sites/${siteId}/modules/form-builder`).set({
    disabledAt: now.toISOString(),
  }, { merge: true })

  logger?.info('Disabled form builder module', { tenantId, siteId })
}
