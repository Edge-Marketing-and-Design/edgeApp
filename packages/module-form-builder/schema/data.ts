import { z } from 'zod'

export const formFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['shortText', 'longText', 'email', 'number', 'select', 'checkbox', 'date']),
  required: z.boolean().default(false),
  options: z.array(z.string().min(1)).optional(),
  helpText: z.string().optional(),
  placeholder: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  ui: z.record(z.unknown()).optional(),
})

export const formAudienceSchema = z.object({
  roles: z.array(z.string().min(1)).optional(),
  groups: z.array(z.string().min(1)).optional(),
  tenants: z.array(z.string().min(1)).optional(),
  users: z.array(z.string().min(1)).optional(),
}).partial()

export const formSubmissionAccessSchema = z.object({
  roles: z.array(z.string().min(1)).optional(),
  users: z.array(z.string().min(1)).optional(),
}).partial()

export const formSubmissionPolicySchema = z.object({
  requireTurnstile: z.boolean().default(false),
  rateLimitWindowSeconds: z.number().int().min(10).default(60),
  rateLimitMaxPerWindow: z.number().int().min(1).default(30),
  requireEmailVerification: z.boolean().default(false),
}).partial()

export const formSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  visibility: z.enum(['public', 'authenticated', 'both']).default('authenticated'),
  audience: formAudienceSchema.optional(),
  submissionAccess: formSubmissionAccessSchema.optional(),
  submissionPolicy: formSubmissionPolicySchema.optional(),
  activeVersionId: z.string().min(1).optional(),
  fields: z.array(formFieldSchema).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export const formIntegrationSchema = z.object({
  id: z.string().min(1).optional(),
  type: z.string().min(1),
  name: z.string().min(1).optional(),
  enabled: z.boolean().default(true),
  config: z.record(z.unknown()).default({}),
})

export const formVersionSchema = z.object({
  id: z.string().min(1),
  formId: z.string().min(1),
  version: z.number().int().min(1).default(1),
  schema: z.record(z.unknown()).optional(),
  uiSchema: z.record(z.unknown()).optional(),
  fields: z.array(formFieldSchema).optional(),
  settings: z.record(z.unknown()).optional(),
  integrations: z.array(formIntegrationSchema).default([]),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export const formSubmissionSchema = z.object({
  id: z.string().min(1),
  formId: z.string().min(1),
  formVersionId: z.string().min(1),
  status: z.enum(['received', 'processing', 'complete', 'failed']).default('received'),
  data: z.record(z.string(), z.unknown()),
  index: z.record(z.string(), z.unknown()).default({}),
  meta: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export const formIntegrationJobSchema = z.object({
  id: z.string().min(1),
  submissionId: z.string().min(1),
  formId: z.string().min(1),
  formVersionId: z.string().min(1),
  type: z.string().min(1),
  status: z.enum(['pending', 'processing', 'complete', 'failed']).default('pending'),
  attempts: z.number().int().min(0).default(0),
  lastError: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export type FormField = z.infer<typeof formFieldSchema>
export type FormRecord = z.infer<typeof formSchema>
export type FormVersion = z.infer<typeof formVersionSchema>
export type FormSubmission = z.infer<typeof formSubmissionSchema>
export type FormIntegrationJob = z.infer<typeof formIntegrationJobSchema>
