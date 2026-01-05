import { describe, expect, it } from 'vitest'
import { formBuilderConfigSchema } from '../packages/module-form-builder/schema/config'
import { formSchema, formSubmissionSchema, formVersionSchema } from '../packages/module-form-builder/schema/data'

describe('module form builder schema validation', () => {
  it('applies config defaults when values are omitted', () => {
    const config = formBuilderConfigSchema.parse({})

    expect(config).toEqual({
      allowFileUploads: false,
      maxResponseCount: 5000,
      notifyOnSubmission: true,
      requireTurnstileForPublic: false,
      rateLimitWindowSeconds: 60,
      rateLimitMaxPerWindow: 30,
    })
  })

  it('rejects forms without required id or name', () => {
    expect(() => formSchema.parse({ name: 'Missing id' })).toThrow()
    expect(() => formSchema.parse({ id: 'missing-name' })).toThrow()
  })

  it('applies form defaults for status and visibility', () => {
    const form = formSchema.parse({
      id: 'contact-us',
      name: 'Contact us',
    })

    expect(form.status).toBe('draft')
    expect(form.visibility).toBe('authenticated')
  })

  it('accepts form versions with either fields or schema and applies defaults', () => {
    const versionWithFields = formVersionSchema.parse({
      id: 'contact-us-v1',
      formId: 'contact-us',
      fields: [
        {
          id: 'fullName',
          label: 'Full name',
          type: 'shortText',
          required: true,
        },
      ],
    })

    expect(versionWithFields.version).toBe(1)
    expect(versionWithFields.integrations).toEqual([])

    const versionWithSchema = formVersionSchema.parse({
      id: 'contact-us-v2',
      formId: 'contact-us',
      schema: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
    })

    expect(versionWithSchema.version).toBe(1)
    expect(versionWithSchema.integrations).toEqual([])
  })

  it('requires submission fields and defaults status', () => {
    expect(() => formSubmissionSchema.parse({
      id: 'submission-1',
      formVersionId: 'contact-us-v1',
      data: { email: 'test@example.com' },
    })).toThrow()

    const submission = formSubmissionSchema.parse({
      id: 'submission-2',
      formId: 'contact-us',
      formVersionId: 'contact-us-v1',
      data: { email: 'test@example.com' },
    })

    expect(submission.status).toBe('received')
  })
})
