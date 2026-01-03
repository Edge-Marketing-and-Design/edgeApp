export type EdgeModuleScope = 'tenant' | 'site'

export interface EdgeModuleCompatibility {
  platform?: string
  edgeDevFirebase?: string
}

export interface EdgeModuleUiNavItem {
  label: string
  to: string
  icon?: string
}

export interface EdgeModuleUiWidget {
  id: string
  component: unknown
}

export interface EdgeModuleUiConfig {
  adminNav?: EdgeModuleUiNavItem[]
  widgets?: EdgeModuleUiWidget[]
}

export interface EdgeModuleDataConfig {
  collections?: string[]
  indexes?: unknown[]
  rulesFragments?: unknown[]
}

export interface EdgeModuleLifecycleContext {
  edgeFirebase: any
  orgId: string
  siteId?: string
  moduleId: string
  config?: Record<string, unknown>
}

export interface EdgeModuleLifecycle {
  install?: (ctx: EdgeModuleLifecycleContext) => Promise<void> | void
  upgrade?: (
    ctx: EdgeModuleLifecycleContext,
    fromVersion: string,
    toVersion: string
  ) => Promise<void> | void
  uninstall?: (ctx: EdgeModuleLifecycleContext) => Promise<void> | void
}

export interface EdgeModuleBreakingChange {
  version: string
  description: string
}

export interface EdgeModuleManifest {
  id: string
  version: string
  scope: EdgeModuleScope[]
  compatibility?: EdgeModuleCompatibility
  permissions?: string[]
  entitlements?: string[]
  ui?: EdgeModuleUiConfig
  data?: EdgeModuleDataConfig
  breakingChanges?: EdgeModuleBreakingChange[]
  lifecycle?: EdgeModuleLifecycle
}

export interface EdgeModuleInstallRecord {
  moduleId: string
  installedVersion: string
  enabled: boolean
  installedAt: string
  updatedAt: string
  uninstalledAt?: string
  config?: Record<string, unknown>
  upgradeHistory?: Array<{
    fromVersion: string
    toVersion: string
    upgradedAt: string
    breakingChanges?: EdgeModuleBreakingChange[]
  }>
}

export interface EdgeModuleSiteRecord {
  moduleId: string
  enabled: boolean
  updatedAt: string
  configOverrides?: Record<string, unknown>
}

export interface EdgeModuleAccessResult {
  allowed: boolean
  reasons: string[]
  config: Record<string, unknown>
}
