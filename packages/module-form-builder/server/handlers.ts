import { assertFormBuilderEnabled } from './guards'
import { formSchema, formResponseSchema } from '../schema/data'

export type FormBuilderRequestContext = {
  db: {
    doc: (path: string) => { get: () => Promise<{ exists: boolean, data?: () => unknown }>, set: (data: unknown, options?: { merge?: boolean }) => Promise<void> }
    collection: (path: string) => { doc: (id: string) => { set: (data: unknown, options?: { merge?: boolean }) => Promise<void> } }
  }
  tenantId: string
  siteId: string
  now: Date
}

export async function createForm(context: FormBuilderRequestContext, payload: unknown) {
  await assertFormBuilderEnabled(context.db, context.tenantId)
  const form = formSchema.parse(payload)
  const formRef = context.db.doc(`tenants/${context.tenantId}/sites/${context.siteId}/forms/${form.id}`)

  await formRef.set({
    ...form,
    createdAt: context.now.toISOString(),
    updatedAt: context.now.toISOString(),
  }, { merge: true })

  return form
}

export async function updateForm(context: FormBuilderRequestContext, payload: unknown) {
  await assertFormBuilderEnabled(context.db, context.tenantId)
  const form = formSchema.parse(payload)
  const formRef = context.db.doc(`tenants/${context.tenantId}/sites/${context.siteId}/forms/${form.id}`)

  await formRef.set({
    ...form,
    updatedAt: context.now.toISOString(),
  }, { merge: true })

  return form
}

export async function submitFormResponse(context: FormBuilderRequestContext, payload: unknown) {
  const response = formResponseSchema.parse(payload)
  const responseRef = context.db.doc(
    `tenants/${context.tenantId}/sites/${context.siteId}/forms/${response.formId}/responses/${response.id}`,
  )

  await responseRef.set({
    ...response,
    submittedAt: context.now.toISOString(),
  }, { merge: true })

  return response
}
