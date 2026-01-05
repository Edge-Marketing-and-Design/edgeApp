import { describe, expect, it } from 'vitest'
import { assertFormBuilderEnabled } from '../packages/module-form-builder/server/guards'

describe('form builder guards', () => {
  it('throws when module document does not exist', async () => {
    const db = {
      doc: () => ({
        get: async () => ({ exists: false }),
      }),
    }

    await expect(assertFormBuilderEnabled(db, 'org-1')).rejects.toThrow(
      'Form builder module is not enabled for this organization.',
    )
  })

  it('throws when module is disabled', async () => {
    const db = {
      doc: () => ({
        get: async () => ({ exists: true, data: () => ({ enabled: false }) }),
      }),
    }

    await expect(assertFormBuilderEnabled(db, 'org-1')).rejects.toThrow(
      'Form builder module is not enabled for this organization.',
    )
  })

  it('passes when module is enabled', async () => {
    const db = {
      doc: () => ({
        get: async () => ({ exists: true, data: () => ({ enabled: true }) }),
      }),
    }

    await expect(assertFormBuilderEnabled(db, 'org-1')).resolves.toBeUndefined()
  })
})
