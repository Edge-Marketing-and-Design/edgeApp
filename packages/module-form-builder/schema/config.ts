import { z } from 'zod'

export const formBuilderConfigSchema = z.object({
  allowFileUploads: z.boolean().default(false),
  maxResponseCount: z.number().int().min(1).default(5000),
  notifyOnSubmission: z.boolean().default(true),
  submissionWebhookUrl: z.string().url().optional().or(z.literal('')),
})

export type FormBuilderConfig = z.infer<typeof formBuilderConfigSchema>

export const formBuilderConfigDefaults: FormBuilderConfig = {
  allowFileUploads: false,
  maxResponseCount: 5000,
  notifyOnSubmission: true,
  submissionWebhookUrl: '',
}
