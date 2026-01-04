export type ModuleScope = 'tenant' | 'site'

export type FormBuilderModuleConfig = {
  allowFileUploads: boolean
  maxResponseCount: number
  notifyOnSubmission: boolean
  submissionWebhookUrl?: string
  turnstileSecret?: string
  requireTurnstileForPublic: boolean
  rateLimitWindowSeconds: number
  rateLimitMaxPerWindow: number
}

export type ModuleInstallContext = {
  db: {
    doc: (path: string) => { set: (data: unknown, options?: { merge?: boolean }) => Promise<void> }
    collection: (path: string) => { doc: (id: string) => { set: (data: unknown, options?: { merge?: boolean }) => Promise<void> } }
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
