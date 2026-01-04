import type { EdgeModuleManifest } from '~/lib/edge-modules/types'
import { formBuilderConfigDefaults } from '~/edge-modules/form-builder.config'

const nowIso = () => new Date().toISOString()

const ensureSiteConfig = async (edgeFirebase: any, orgId: string, siteId: string) => {
  const collectionPath = `organizations/${orgId}/sites/${siteId}/modules`
  await edgeFirebase.storeDoc(collectionPath, {
    docId: 'form-builder',
    config: formBuilderConfigDefaults,
    updatedAt: nowIso(),
  })
}

const seedWelcomeForm = async (edgeFirebase: any, orgId: string, siteId: string) => {
  const formsCollection = `organizations/${orgId}/sites/${siteId}/forms`
  const versionsCollection = `organizations/${orgId}/sites/${siteId}/formVersions`
  const versionId = 'welcome-form-v1'
  const schema = {
    type: 'object',
    required: ['fullName', 'email'],
    properties: {
      fullName: { type: 'string', title: 'Full name' },
      email: { type: 'string', format: 'email', title: 'Email address' },
    },
  }

  await edgeFirebase.storeDoc(versionsCollection, {
    docId: versionId,
    formId: 'welcome-form',
    version: 1,
    schema,
    uiSchema: {},
    integrations: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })
  await edgeFirebase.storeDoc(formsCollection, {
    docId: 'welcome-form',
    name: 'Welcome Form',
    description: 'A starter form to verify the form builder setup.',
    status: 'draft',
    visibility: 'authenticated',
    activeVersionId: versionId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })
}

export const edgeModule: EdgeModuleManifest = {
  id: 'form-builder',
  version: '0.2.0',
  scope: ['tenant', 'site'],
  compatibility: {
    platform: '>=1.0.0 <2.0.0',
  },
  permissions: ['forms:read', 'forms:write', 'forms:publish'],
  ui: {
    adminNav: [{ label: 'Forms', to: '/app/dashboard/forms' }],
  },
  data: {
    collections: ['forms', 'formVersions', 'formSubmissions', 'formIntegrationJobs'],
  },
  lifecycle: {
    install: async ({ edgeFirebase, orgId, siteId }) => {
      if (!siteId) {
        return
      }
      await ensureSiteConfig(edgeFirebase, orgId, siteId)
      await seedWelcomeForm(edgeFirebase, orgId, siteId)
    },
    upgrade: async ({ edgeFirebase, orgId, siteId }, fromVersion, toVersion) => {
      if (!siteId) {
        return
      }
      await ensureSiteConfig(edgeFirebase, orgId, siteId)
      console.log(`[form-builder] upgraded ${orgId}/${siteId} ${fromVersion} -> ${toVersion}`)
    },
    uninstall: async ({ edgeFirebase, orgId, siteId }) => {
      if (!siteId) {
        return
      }
      const collectionPath = `organizations/${orgId}/sites/${siteId}/modules`
      await edgeFirebase.changeDoc(collectionPath, 'form-builder', {
        disabledAt: nowIso(),
        updatedAt: nowIso(),
      })
    },
  },
}
