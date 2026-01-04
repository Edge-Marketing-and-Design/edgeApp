import { describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST
const run = emulatorHost ? it : it.skip

const buildRequest = (path: string, payload: Record<string, any>) => {
  const raw = JSON.stringify(payload)
  return {
    method: 'POST',
    path,
    headers: {
      'content-type': 'application/json',
    },
    body: payload,
    rawBody: Buffer.from(raw),
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
  }
}

const runHandler = async (handler: any, req: any) => {
  const res: any = {
    headers: {},
    statusCode: 200,
    body: undefined,
    set(key: string, value: string) {
      this.headers[key] = value
      return this
    },
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(payload: any) {
      this.body = payload
      return this
    },
    send(payload: any) {
      this.body = payload
      return this
    },
  }

  await handler(req, res)
  return res
}

describe('form submission pipeline (emulator)', () => {
  run('stores submission and queues integration jobs', async () => {
    const require = createRequire(import.meta.url)
    const admin = require('firebase-admin')
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: 'edge-form-builder-test' })
    }

    const { formBuilderSubmitForm } = require('../../functions/form-builder.js')

    const db = admin.firestore()
    const orgId = `test-org-${Date.now()}`
    const siteId = `test-site-${Date.now()}`
    const formId = 'contact-form'
    const versionId = `${formId}-v1`

    await db.doc(`organizations/${orgId}/modules/form-builder`).set({
      enabled: true,
    })
    await db.doc(`organizations/${orgId}/sites/${siteId}/modules/form-builder`).set({
      config: {
        submissionWebhookUrl: '',
      },
    })
    await db.doc(`organizations/${orgId}/sites/${siteId}/forms/${formId}`).set({
      id: formId,
      status: 'published',
      visibility: 'public',
      activeVersionId: versionId,
    })
    await db.doc(`organizations/${orgId}/sites/${siteId}/formVersions/${versionId}`).set({
      id: versionId,
      formId,
      version: 1,
      integrations: [
        {
          type: 'webhook',
          enabled: true,
          config: {
            url: 'https://example.com/webhook',
          },
        },
      ],
    })

    const payload = {
      values: {
        email: 'Test@Example.com',
        ticketCount: 2,
      },
    }

    const req = buildRequest(`/api/forms/${orgId}/${siteId}/${formId}/submit`, payload)
    const res = await runHandler(formBuilderSubmitForm, req)

    expect(res.statusCode).toBe(200)
    expect(res.body?.ok).toBe(true)
    expect(res.body?.submissionId).toBeTruthy()

    const submissionSnap = await db
      .doc(`organizations/${orgId}/sites/${siteId}/formSubmissions/${res.body.submissionId}`)
      .get()
    expect(submissionSnap.exists).toBe(true)

    const submission = submissionSnap.data() || {}
    expect(submission.formVersionId).toBe(versionId)
    expect(submission.index?.email).toBe('test@example.com')
    expect(submission.index?.ticketCount).toBe(2)

    const jobsSnap = await db
      .collection(`organizations/${orgId}/sites/${siteId}/formIntegrationJobs`)
      .where('submissionId', '==', res.body.submissionId)
      .get()

    expect(jobsSnap.size).toBe(1)
  })
})
