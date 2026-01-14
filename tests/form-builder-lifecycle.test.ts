import { describe, expect, it, vi } from 'vitest'
import { installFormBuilderModule, uninstallFormBuilderModule, upgradeFormBuilderModule } from '../packages/module-form-builder/server/lifecycle'
import { formBuilderConfigDefaults } from '../packages/module-form-builder/schema/config'
import { formBuilderMigrations } from '../packages/module-form-builder/migrations'

const orgId = 'org-1'
const siteId = 'site-1'
const now = new Date('2024-01-01T12:00:00.000Z')

const createDb = () => {
  const setCalls = new Map<string, unknown>()
  const doc = vi.fn((path: string) => ({
    set: vi.fn(async (data: unknown) => {
      setCalls.set(path, data)
    }),
  }))

  return { db: { doc }, setCalls }
}

describe('form builder lifecycle', () => {
  it('installs module and site config with defaults', async () => {
    const { db, setCalls } = createDb()

    await installFormBuilderModule({ db, orgId, siteId, now })

    expect(setCalls.get(`organizations/${orgId}/modules/form-builder`)).toMatchObject({
      id: 'form-builder',
      enabled: true,
      installedAt: now.toISOString(),
    })
    expect(setCalls.get(`organizations/${orgId}/sites/${siteId}/modules/form-builder`)).toMatchObject({
      config: formBuilderConfigDefaults,
      updatedAt: now.toISOString(),
    })
  })

  it('runs migrations on upgrade', async () => {
    const { db } = createDb()
    const runSpy = vi.spyOn(formBuilderMigrations[0], 'run').mockResolvedValue()

    await upgradeFormBuilderModule({
      db,
      orgId,
      siteId,
      now,
      fromVersion: '0.1.0',
      toVersion: '0.2.0',
    })

    expect(runSpy).toHaveBeenCalledTimes(1)
    runSpy.mockRestore()
  })

  it('disables module and site config on uninstall', async () => {
    const { db, setCalls } = createDb()

    await uninstallFormBuilderModule({ db, orgId, siteId, now })

    expect(setCalls.get(`organizations/${orgId}/modules/form-builder`)).toMatchObject({
      enabled: false,
      uninstalledAt: now.toISOString(),
    })
    expect(setCalls.get(`organizations/${orgId}/sites/${siteId}/modules/form-builder`)).toMatchObject({
      disabledAt: now.toISOString(),
    })
  })
})
