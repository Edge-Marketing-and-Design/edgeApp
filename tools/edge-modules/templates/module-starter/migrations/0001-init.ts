import { __MODULE_CAMEL__ConfigDefaults } from '../schema/config'

export type __MODULE_PASCAL__MigrationContext = {
  db: {
    doc: (path: string) => { set: (data: unknown, options?: { merge?: boolean }) => Promise<void> }
  }
  orgId: string
  siteId: string
  now: Date
}

export const migrationId = '0001-init'

export async function runMigration(context: __MODULE_PASCAL__MigrationContext) {
  const { db, orgId, siteId, now } = context
  const moduleConfigRef = db.doc(`organizations/${orgId}/sites/${siteId}/modules/__MODULE_ID__`)

  await moduleConfigRef.set({
    config: __MODULE_CAMEL__ConfigDefaults,
    updatedAt: now.toISOString(),
  }, { merge: true })
}
