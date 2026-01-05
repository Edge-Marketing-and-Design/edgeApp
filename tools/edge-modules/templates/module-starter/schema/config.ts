import { z } from 'zod'

export const __MODULE_CAMEL__ConfigSchema = z.object({
  enabled: z.boolean().default(true),
  notes: z.string().optional(),
})

export type __MODULE_PASCAL__Config = z.infer<typeof __MODULE_CAMEL__ConfigSchema>

export const __MODULE_CAMEL__ConfigDefaults: __MODULE_PASCAL__Config = {
  enabled: true,
  notes: '',
}
