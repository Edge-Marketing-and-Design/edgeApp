import { formBuilderConfigDefaults } from '../schema/config'

export type FormBuilderMigrationContext = {
  db: {
    doc: (path: string) => { set: (data: unknown, options?: { merge?: boolean }) => Promise<void> }
  }
  orgId: string
  siteId: string
  now: Date
}

export const migrationId = '0001-init'

export async function runMigration(context: FormBuilderMigrationContext) {
  const { db, orgId, siteId, now } = context
  const moduleConfigRef = db.doc(`organizations/${orgId}/sites/${siteId}/modules/form-builder`)

  await moduleConfigRef.set({
    config: formBuilderConfigDefaults,
    updatedAt: now.toISOString(),
  }, { merge: true })

  const starterFormRef = db.doc(`organizations/${orgId}/sites/${siteId}/forms/welcome-form`)
  const starterVersionRef = db.doc(`organizations/${orgId}/sites/${siteId}/formVersions/welcome-form-v1`)
  const schema = {
    type: 'object',
    required: ['fullName', 'email'],
    properties: {
      fullName: { type: 'string', title: 'Full name' },
      email: { type: 'string', format: 'email', title: 'Email address' },
    },
  }

  await starterVersionRef.set({
    id: 'welcome-form-v1',
    formId: 'welcome-form',
    version: 1,
    schema,
    uiSchema: {},
    integrations: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }, { merge: true })
  await starterFormRef.set({
    id: 'welcome-form',
    name: 'Welcome Form',
    description: 'A starter form to verify the form builder setup.',
    status: 'draft',
    visibility: 'authenticated',
    activeVersionId: 'welcome-form-v1',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }, { merge: true })
}
