import { assertFormBuilderEnabled } from './guards'
import { formSchema, formSubmissionSchema, formVersionSchema } from '../schema/data'

export type FormBuilderRequestContext = {
  db: {
    doc: (path: string) => { get: () => Promise<{ exists: boolean, data?: () => unknown }>, set: (data: unknown, options?: { merge?: boolean }) => Promise<void> }
    collection: (path: string) => { doc: (id: string) => { set: (data: unknown, options?: { merge?: boolean }) => Promise<void> } }
  }
  orgId: string
  siteId: string
  now: Date
}

export async function createForm(context: FormBuilderRequestContext, payload: unknown) {
  await assertFormBuilderEnabled(context.db, context.orgId)
  const form = formSchema.parse(payload)
  const formRef = context.db.doc(`organizations/${context.orgId}/sites/${context.siteId}/forms/${form.id}`)

  await formRef.set({
    ...form,
    createdAt: context.now.toISOString(),
    updatedAt: context.now.toISOString(),
  }, { merge: true })

  return form
}

export async function updateForm(context: FormBuilderRequestContext, payload: unknown) {
  await assertFormBuilderEnabled(context.db, context.orgId)
  const form = formSchema.parse(payload)
  const formRef = context.db.doc(`organizations/${context.orgId}/sites/${context.siteId}/forms/${form.id}`)

  await formRef.set({
    ...form,
    updatedAt: context.now.toISOString(),
  }, { merge: true })

  return form
}

export async function createFormVersion(context: FormBuilderRequestContext, payload: unknown) {
  await assertFormBuilderEnabled(context.db, context.orgId)
  const formVersion = formVersionSchema.parse(payload)
  const versionRef = context.db.doc(
    `organizations/${context.orgId}/sites/${context.siteId}/formVersions/${formVersion.id}`,
  )

  await versionRef.set({
    ...formVersion,
    createdAt: context.now.toISOString(),
    updatedAt: context.now.toISOString(),
  }, { merge: true })

  return formVersion
}

export async function submitFormResponse(context: FormBuilderRequestContext, payload: unknown) {
  const submission = formSubmissionSchema.parse(payload)
  const submissionRef = context.db.doc(
    `organizations/${context.orgId}/sites/${context.siteId}/formSubmissions/${submission.id}`,
  )

  await submissionRef.set({
    ...submission,
    createdAt: context.now.toISOString(),
    updatedAt: context.now.toISOString(),
  }, { merge: true })

  return submission
}
