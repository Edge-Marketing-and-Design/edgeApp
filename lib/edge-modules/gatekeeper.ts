import satisfies from 'semver/functions/satisfies'
import coerce from 'semver/functions/coerce'
import type {
  EdgeModuleAccessResult,
  EdgeModuleManifest,
  EdgeModuleInstallRecord,
  EdgeModuleSiteRecord,
} from './types'

const satisfiesRange = (version: string, range?: string) => {
  if (!range)
    return true
  const coerced = coerce(version)
  if (!coerced)
    return false
  return satisfies(coerced, range, { includePrerelease: true })
}

export const resolveModuleConfig = (
  tenantRecord?: EdgeModuleInstallRecord,
  siteRecord?: EdgeModuleSiteRecord,
) => {
  return {
    ...(tenantRecord?.config || {}),
    ...(siteRecord?.configOverrides || {}),
  }
}

interface EdgeModuleAccessInput {
  manifest?: EdgeModuleManifest
  tenantRecord?: EdgeModuleInstallRecord
  siteRecord?: EdgeModuleSiteRecord
  platformVersion: string
  edgeDevFirebaseVersion?: string
  userPermissions?: string[]
  entitlements?: string[]
}

export const evaluateModuleAccess = ({
  manifest,
  tenantRecord,
  siteRecord,
  platformVersion,
  edgeDevFirebaseVersion,
  userPermissions = [],
  entitlements = [],
}: EdgeModuleAccessInput): EdgeModuleAccessResult => {
  const reasons: string[] = []

  if (!manifest) {
    reasons.push('missing-manifest')
    return { allowed: false, reasons, config: {} }
  }

  if (!tenantRecord) {
    reasons.push('not-installed')
  }

  if (manifest.compatibility?.platform) {
    const ok = satisfiesRange(platformVersion, manifest.compatibility.platform)
    if (!ok)
      reasons.push('incompatible-platform')
  }

  if (manifest.compatibility?.edgeDevFirebase && edgeDevFirebaseVersion) {
    const ok = satisfiesRange(
      edgeDevFirebaseVersion,
      manifest.compatibility.edgeDevFirebase,
    )
    if (!ok)
      reasons.push('incompatible-edge-dev-firebase')
  }

  if (tenantRecord && tenantRecord.enabled === false) {
    reasons.push('disabled-tenant')
  }

  if (manifest.scope.includes('site') && siteRecord?.enabled === false) {
    reasons.push('disabled-site')
  }

  if (manifest.entitlements?.length) {
    const missing = manifest.entitlements.filter(item => !entitlements.includes(item))
    if (missing.length)
      reasons.push('missing-entitlement')
  }

  if (manifest.permissions?.length) {
    const missing = manifest.permissions.filter(item => !userPermissions.includes(item))
    if (missing.length)
      reasons.push('missing-permission')
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    config: resolveModuleConfig(tenantRecord, siteRecord),
  }
}
