import { z } from 'zod'

export const formFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['shortText', 'longText', 'email', 'number', 'select', 'checkbox', 'date']),
  required: z.boolean().default(false),
  options: z.array(z.string().min(1)).optional(),
})

export const formSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  fields: z.array(formFieldSchema).default([]),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export const formResponseSchema = z.object({
  id: z.string().min(1),
  formId: z.string().min(1),
  values: z.record(z.string(), z.unknown()),
  submittedAt: z.string().datetime().optional(),
})

export type FormField = z.infer<typeof formFieldSchema>
export type FormRecord = z.infer<typeof formSchema>
export type FormResponse = z.infer<typeof formResponseSchema>
