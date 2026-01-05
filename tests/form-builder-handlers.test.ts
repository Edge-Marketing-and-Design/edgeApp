import { describe, expect, it, vi } from 'vitest'
import { createForm, createFormVersion, submitFormResponse, updateForm } from '../packages/module-form-builder/server/handlers'

describe('form builder handlers', () => {
  const orgId = 'org-1'
  const siteId = 'site-1'
  const now = new Date('2024-01-01T12:00:00.000Z')

  const createDb = () => {
    const setCalls = new Map<string, unknown>()
    const setOptions = new Map<string, unknown>()

    const doc = vi.fn((path: string) => ({
      get: async () => ({ exists: true, data: () => ({ enabled: true }) }),
      set: vi.fn(async (data: unknown, options?: { merge?: boolean }) => {
        setCalls.set(path, data)
        setOptions.set(path, options)
      }),
    }))

    return {
      db: { doc, collection: vi.fn() },
      setCalls,
      setOptions,
    }
  }

  it('createForm rejects invalid payload and writes timestamps on success', async () => {
    const { db, setCalls } = createDb()

    await expect(createForm({ db, orgId, siteId, now }, { name: 'Missing id' })).rejects.toThrow()
    expect(setCalls.size).toBe(0)

    const form = await createForm(
      { db, orgId, siteId, now },
      { id: 'contact', name: 'Contact', status: 'draft', visibility: 'public' },
    )

    const formPath = `organizations/${orgId}/sites/${siteId}/forms/contact`
    const stored = setCalls.get(formPath) as Record<string, unknown>

    expect(form).toEqual(expect.objectContaining({ id: 'contact', name: 'Contact' }))
    expect(stored).toMatchObject({
      id: 'contact',
      name: 'Contact',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
  })

  it('updateForm rejects invalid payload and writes updatedAt on success', async () => {
    const { db, setCalls } = createDb()

    await expect(updateForm({ db, orgId, siteId, now }, { id: '' })).rejects.toThrow()
    expect(setCalls.size).toBe(0)

    await updateForm(
      { db, orgId, siteId, now },
      { id: 'contact', name: 'Contact', status: 'published', visibility: 'both' },
    )

    const formPath = `organizations/${orgId}/sites/${siteId}/forms/contact`
    const stored = setCalls.get(formPath) as Record<string, unknown>

    expect(stored).toMatchObject({
      id: 'contact',
      updatedAt: now.toISOString(),
    })
    expect(stored).not.toHaveProperty('createdAt')
  })

  it('createFormVersion rejects invalid payload and writes version data', async () => {
    const { db, setCalls } = createDb()

    await expect(createFormVersion({ db, orgId, siteId, now }, { formId: 'contact' })).rejects.toThrow()
    expect(setCalls.size).toBe(0)

    await createFormVersion(
      { db, orgId, siteId, now },
      {
        id: 'contact-v1',
        formId: 'contact',
        version: 1,
        schema: { type: 'object', properties: { email: { type: 'string' } } },
      },
    )

    const versionPath = `organizations/${orgId}/sites/${siteId}/formVersions/contact-v1`
    const stored = setCalls.get(versionPath) as Record<string, unknown>

    expect(stored).toMatchObject({
      id: 'contact-v1',
      formId: 'contact',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
  })

  it('submitFormResponse writes submission without guard', async () => {
    const { db, setCalls } = createDb()

    await submitFormResponse(
      { db, orgId, siteId, now },
      {
        id: 'submission-1',
        formId: 'contact',
        formVersionId: 'contact-v1',
        data: { email: 'test@example.com' },
      },
    )

    const submissionPath = `organizations/${orgId}/sites/${siteId}/formSubmissions/submission-1`
    const stored = setCalls.get(submissionPath) as Record<string, unknown>

    expect(stored).toMatchObject({
      id: 'submission-1',
      status: 'received',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
  })
})
