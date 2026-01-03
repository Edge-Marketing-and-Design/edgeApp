const test = require('node:test')
const assert = require('node:assert/strict')

require('ts-node/register/transpile-only')

const { evaluateModuleAccess } = require('../../../lib/edge-modules/gatekeeper.ts')

const baseManifest = {
  id: 'form-builder',
  version: '1.2.0',
  scope: ['tenant', 'site'],
  compatibility: {
    platform: '>=1.0.0 <2.0.0',
  },
  permissions: ['forms:read', 'forms:write'],
  entitlements: ['pro'],
}

test('allows access when installed, enabled, and compatible', () => {
  const result = evaluateModuleAccess({
    manifest: baseManifest,
    tenantRecord: {
      moduleId: 'form-builder',
      installedVersion: '1.2.0',
      enabled: true,
      installedAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    siteRecord: {
      moduleId: 'form-builder',
      enabled: true,
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    platformVersion: '1.0.0',
    userPermissions: ['forms:read', 'forms:write'],
    entitlements: ['pro'],
  })

  assert.equal(result.allowed, true)
  assert.deepEqual(result.reasons, [])
})

test('blocks access when missing entitlement', () => {
  const result = evaluateModuleAccess({
    manifest: baseManifest,
    tenantRecord: {
      moduleId: 'form-builder',
      installedVersion: '1.2.0',
      enabled: true,
      installedAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    platformVersion: '1.0.0',
    userPermissions: ['forms:read', 'forms:write'],
    entitlements: [],
  })

  assert.equal(result.allowed, false)
  assert.ok(result.reasons.includes('missing-entitlement'))
})

test('blocks access when site is disabled', () => {
  const result = evaluateModuleAccess({
    manifest: baseManifest,
    tenantRecord: {
      moduleId: 'form-builder',
      installedVersion: '1.2.0',
      enabled: true,
      installedAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    siteRecord: {
      moduleId: 'form-builder',
      enabled: false,
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    platformVersion: '1.0.0',
    userPermissions: ['forms:read', 'forms:write'],
    entitlements: ['pro'],
  })

  assert.equal(result.allowed, false)
  assert.ok(result.reasons.includes('disabled-site'))
})
