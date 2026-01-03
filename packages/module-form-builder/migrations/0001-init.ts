import { formBuilderConfigDefaults } from '../schema/config'

export type FormBuilderMigrationContext = {
  db: {
    doc: (path: string) => { set: (data: unknown, options?: { merge?: boolean }) => Promise<void> }
  }
  tenantId: string
  siteId: string
  now: Date
}

export const migrationId = '0001-init'

export async function runMigration(context: FormBuilderMigrationContext) {
  const { db, tenantId, siteId, now } = context
  const moduleConfigRef = db.doc(`tenants/${tenantId}/sites/${siteId}/modules/form-builder`)

  await moduleConfigRef.set({
    config: formBuilderConfigDefaults,
    updatedAt: now.toISOString(),
  }, { merge: true })

  const starterFormRef = db.doc(`tenants/${tenantId}/sites/${siteId}/forms/welcome-form`)
  await starterFormRef.set({
    id: 'welcome-form',
    name: 'Welcome Form',
    description: 'A starter form to verify the form builder setup.',
    status: 'draft',
    fields: [
      {
        id: 'fullName',
        label: 'Full name',
        type: 'shortText',
        required: true,
      },
      {
        id: 'email',
        label: 'Email address',
        type: 'email',
        required: true,
      },
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }, { merge: true })
}
