import type { EdgeModuleManifest } from '~/lib/edge-modules/types'
import { __MODULE_CAMEL__ConfigDefaults } from '~/edge-modules/__MODULE_ID__.config'

const nowIso = () => new Date().toISOString()

const ensureSiteConfig = async (edgeFirebase: any, orgId: string, siteId: string) => {
  const collectionPath = `organizations/${orgId}/sites/${siteId}/modules`
  await edgeFirebase.storeDoc(collectionPath, {
    docId: '__MODULE_ID__',
    config: __MODULE_CAMEL__ConfigDefaults,
    updatedAt: nowIso(),
  })
}

export const edgeModule: EdgeModuleManifest = {
  id: '__MODULE_ID__',
  version: '__MODULE_VERSION__',
  scope: ['tenant', 'site'],
  compatibility: {
    platform: '>=1.0.0 <2.0.0',
  },
  permissions: ['__MODULE_ID__:read', '__MODULE_ID__:write'],
  ui: {
    adminNav: [{ label: '__MODULE_LABEL__', to: '__MODULE_ROUTE__' }],
  },
  data: {
    collections: [],
  },
  lifecycle: {
    install: async ({ edgeFirebase, orgId, siteId }) => {
      if (!siteId) {
        return
      }
      await ensureSiteConfig(edgeFirebase, orgId, siteId)
    },
    upgrade: async ({ edgeFirebase, orgId, siteId }, fromVersion, toVersion) => {
      if (!siteId) {
        return
      }
      await ensureSiteConfig(edgeFirebase, orgId, siteId)
      console.log(`[__MODULE_ID__] upgraded ${orgId}/${siteId} ${fromVersion} -> ${toVersion}`)
    },
    uninstall: async ({ edgeFirebase, orgId, siteId }) => {
      if (!siteId) {
        return
      }
      const collectionPath = `organizations/${orgId}/sites/${siteId}/modules`
      await edgeFirebase.changeDoc(collectionPath, '__MODULE_ID__', {
        disabledAt: nowIso(),
        updatedAt: nowIso(),
      })
    },
  },
}
