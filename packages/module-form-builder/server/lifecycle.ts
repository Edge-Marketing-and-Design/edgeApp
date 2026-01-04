import { formBuilderConfigDefaults } from '../schema/config'
import { formBuilderMigrations } from '../migrations'
import type { ModuleInstallContext, ModuleUpgradeContext, ModuleUninstallContext } from '../runtime/types'

export async function installFormBuilderModule(context: ModuleInstallContext) {
  const { db, orgId, siteId, now, logger } = context
  await db.doc(`organizations/${orgId}/modules/form-builder`).set({
    id: 'form-builder',
    installedVersion: '0.2.0',
    enabled: true,
    installedAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }, { merge: true })

  await db.doc(`organizations/${orgId}/sites/${siteId}/modules/form-builder`).set({
    config: formBuilderConfigDefaults,
    updatedAt: now.toISOString(),
  }, { merge: true })

  logger?.info('Installed form builder module', { orgId, siteId })
}

export async function upgradeFormBuilderModule(context: ModuleUpgradeContext) {
  const { fromVersion, toVersion, logger } = context
  for (const migration of formBuilderMigrations) {
    logger?.info('Running form builder migration', { id: migration.id, fromVersion, toVersion })
    await migration.run({
      db: context.db,
      orgId: context.orgId,
      siteId: context.siteId,
      now: context.now,
    })
  }
}

export async function uninstallFormBuilderModule(context: ModuleUninstallContext) {
  const { db, orgId, siteId, now, logger } = context
  await db.doc(`organizations/${orgId}/modules/form-builder`).set({
    enabled: false,
    uninstalledAt: now.toISOString(),
  }, { merge: true })

  await db.doc(`organizations/${orgId}/sites/${siteId}/modules/form-builder`).set({
    disabledAt: now.toISOString(),
  }, { merge: true })

  logger?.info('Disabled form builder module', { orgId, siteId })
}
