import projectInfo from '~/edgeapp.project.json'

const raw = projectInfo as Record<string, string | undefined>

export const EDGE_PLATFORM_VERSION = raw.platformVersion || '0.0.0'
export const EDGE_MODULE_SYSTEM_VERSION = raw.moduleSystemVersion || '0.0.0'
