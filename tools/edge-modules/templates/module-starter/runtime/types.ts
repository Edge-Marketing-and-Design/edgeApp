export type ModuleScope = 'tenant' | 'site'

export type __MODULE_PASCAL__ModuleConfig = {
  enabled: boolean
  notes?: string
}

export type ModuleInstallContext = {
  db: {
    doc: (path: string) => { set: (data: unknown, options?: { merge?: boolean }) => Promise<void> }
  }
  orgId: string
  siteId: string
  now: Date
  logger?: { info: (message: string, meta?: Record<string, unknown>) => void }
}

export type ModuleUpgradeContext = ModuleInstallContext & {
  fromVersion: string
  toVersion: string
}

export type ModuleUninstallContext = ModuleInstallContext
