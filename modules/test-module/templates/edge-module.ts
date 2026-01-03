import type { EdgeModuleManifest } from '~/lib/edge-modules/types'
import { pepTalkMessage } from '~/edge-modules/pep-talk'

export const edgeModule: EdgeModuleManifest = {
  id: 'test-module',
  version: '0.1.0',
  scope: ['tenant', 'site'],
  compatibility: {
    platform: '>=1.0.0 <2.0.0',
  },
  permissions: ['test:read'],
  ui: {
    adminNav: [{ label: 'Test Module', to: '/app/dashboard' }],
  },
  data: {
    collections: ['test-things'],
  },
  lifecycle: {
    install: ({ orgId }) => {
      console.log(`[test-module] install for org ${orgId}: ${pepTalkMessage}`)
    },
    upgrade: ({ orgId }, fromVersion, toVersion) => {
      console.log(
        `[test-module] upgrade for org ${orgId}: ${fromVersion} -> ${toVersion}`,
      )
    },
  },
}
