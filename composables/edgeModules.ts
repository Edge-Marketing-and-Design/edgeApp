import { edgeModuleRegistry } from '~/edge-modules/registry'
import { EDGE_PLATFORM_VERSION } from '~/lib/edge-modules/platform'
import { evaluateModuleAccess } from '~/lib/edge-modules/gatekeeper'
import { getBreakingChanges } from '~/lib/edge-modules/upgrade'
import type {
  EdgeModuleAccessResult,
  EdgeModuleInstallRecord,
  EdgeModuleManifest,
  EdgeModuleSiteRecord,
} from '~/lib/edge-modules/types'

const nowIso = () => new Date().toISOString()

const tenantModulesPath = (orgId: string) => `organizations/${orgId}/modules`
const tenantModuleDocPath = (orgId: string, moduleId: string) =>
  `${tenantModulesPath(orgId)}/${moduleId}`
const siteModulesPath = (orgId: string, siteId: string) =>
  `organizations/${orgId}/sites/${siteId}/modules`
const siteModuleDocPath = (orgId: string, siteId: string, moduleId: string) =>
  `${siteModulesPath(orgId, siteId)}/${moduleId}`

const readCollectionDoc = <T>(
  edgeFirebase: any,
  collectionPath: string,
  docId: string,
): T | undefined => {
  return edgeFirebase?.data?.[collectionPath]?.[docId]
}

export const useEdgeModuleRegistry = () => edgeModuleRegistry

export const startEdgeModuleSnapshots = async (
  edgeFirebase: any,
  orgId: string,
  siteId?: string,
) => {
  await edgeFirebase.startSnapshot(tenantModulesPath(orgId))
  if (siteId) {
    await edgeFirebase.startSnapshot(siteModulesPath(orgId, siteId))
  }
}

export const getTenantModuleRecord = (
  edgeFirebase: any,
  orgId: string,
  moduleId: string,
) => readCollectionDoc<EdgeModuleInstallRecord>(
  edgeFirebase,
  tenantModulesPath(orgId),
  moduleId,
)

export const getSiteModuleRecord = (
  edgeFirebase: any,
  orgId: string,
  siteId: string,
  moduleId: string,
) => readCollectionDoc<EdgeModuleSiteRecord>(
  edgeFirebase,
  siteModulesPath(orgId, siteId),
  moduleId,
)

export const installTenantModule = async (
  edgeFirebase: any,
  orgId: string,
  moduleId: string,
  config: Record<string, unknown> = {},
) => {
  const manifest = edgeModuleRegistry[moduleId]
  if (!manifest) {
    throw new Error(`Unknown module: ${moduleId}`)
  }

  const ctx = { edgeFirebase, orgId, moduleId, config }
  await manifest.lifecycle?.install?.(ctx)

  const payload: EdgeModuleInstallRecord = {
    moduleId,
    installedVersion: manifest.version,
    enabled: true,
    installedAt: nowIso(),
    updatedAt: nowIso(),
    config,
    upgradeHistory: [],
  }

  await edgeFirebase.storeDoc(tenantModulesPath(orgId), payload)
}

export const upgradeTenantModule = async (
  edgeFirebase: any,
  orgId: string,
  moduleId: string,
) => {
  const manifest = edgeModuleRegistry[moduleId]
  if (!manifest) {
    throw new Error(`Unknown module: ${moduleId}`)
  }

  const record = getTenantModuleRecord(edgeFirebase, orgId, moduleId)
  if (!record) {
    throw new Error(`Module not installed: ${moduleId}`)
  }
  const fromVersion = record.installedVersion
  const toVersion = manifest.version

  const ctx = { edgeFirebase, orgId, moduleId, config: record?.config || {} }
  await manifest.lifecycle?.upgrade?.(ctx, fromVersion, toVersion)

  const upgradeHistory = [
    ...(record?.upgradeHistory || []),
    {
      fromVersion,
      toVersion,
      upgradedAt: nowIso(),
      breakingChanges: getBreakingChanges(manifest, fromVersion, toVersion),
    },
  ]

  await edgeFirebase.changeDoc(tenantModulesPath(orgId), moduleId, {
    installedVersion: toVersion,
    updatedAt: nowIso(),
    upgradeHistory,
  })
}

export const setTenantModuleEnabled = async (
  edgeFirebase: any,
  orgId: string,
  moduleId: string,
  enabled: boolean,
) => {
  const record = getTenantModuleRecord(edgeFirebase, orgId, moduleId)
  if (!record) {
    throw new Error(`Module not installed: ${moduleId}`)
  }
  await edgeFirebase.changeDoc(tenantModulesPath(orgId), moduleId, {
    enabled,
    updatedAt: nowIso(),
  })
}

export const setSiteModuleEnabled = async (
  edgeFirebase: any,
  orgId: string,
  siteId: string,
  moduleId: string,
  enabled: boolean,
  configOverrides: Record<string, unknown> = {},
) => {
  const payload: EdgeModuleSiteRecord = {
    moduleId,
    enabled,
    updatedAt: nowIso(),
    configOverrides,
  }
  await edgeFirebase.storeDoc(siteModulesPath(orgId, siteId), payload)
}

export const uninstallTenantModule = async (
  edgeFirebase: any,
  orgId: string,
  moduleId: string,
  soft = true,
) => {
  const manifest = edgeModuleRegistry[moduleId]
  const record = getTenantModuleRecord(edgeFirebase, orgId, moduleId)
  if (!manifest || !record) {
    throw new Error(`Module not installed: ${moduleId}`)
  }

  const ctx = { edgeFirebase, orgId, moduleId, config: record.config || {} }
  await manifest.lifecycle?.uninstall?.(ctx)

  if (!soft && typeof edgeFirebase.removeDoc === 'function') {
    await edgeFirebase.removeDoc(tenantModulesPath(orgId), moduleId)
    return
  }

  await edgeFirebase.changeDoc(tenantModulesPath(orgId), moduleId, {
    enabled: false,
    uninstalledAt: nowIso(),
    updatedAt: nowIso(),
  })
}

export const getModuleAccess = ({
  edgeFirebase,
  orgId,
  siteId,
  moduleId,
  edgeDevFirebaseVersion,
  userPermissions = [],
  entitlements = [],
}: {
  edgeFirebase: any
  orgId: string
  siteId?: string
  moduleId: string
  edgeDevFirebaseVersion?: string
  userPermissions?: string[]
  entitlements?: string[]
}): EdgeModuleAccessResult => {
  const manifest = edgeModuleRegistry[moduleId]
  const tenantRecord = getTenantModuleRecord(edgeFirebase, orgId, moduleId)
  const siteRecord = siteId
    ? getSiteModuleRecord(edgeFirebase, orgId, siteId, moduleId)
    : undefined

  return evaluateModuleAccess({
    manifest,
    tenantRecord,
    siteRecord,
    platformVersion: EDGE_PLATFORM_VERSION,
    edgeDevFirebaseVersion,
    userPermissions,
    entitlements,
  })
}

export const listAvailableModules = (): EdgeModuleManifest[] => {
  return Object.values(edgeModuleRegistry)
}

export const listInstalledModules = (
  edgeFirebase: any,
  orgId: string,
): EdgeModuleInstallRecord[] => {
  const collection = edgeFirebase?.data?.[tenantModulesPath(orgId)] || {}
  return Object.values(collection)
}
