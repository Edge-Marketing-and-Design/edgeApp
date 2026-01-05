export type FormFieldDefinition = {
  id: string
  label?: string
  type?: string
  required?: boolean
  options?: string[]
  helpText?: string
  placeholder?: string
  min?: number
  max?: number
  pattern?: string
  ui?: Record<string, unknown>
}

export const buildSchemaFromFields = (fields: FormFieldDefinition[]) => {
  const properties: Record<string, any> = {}
  const required: string[] = []

  fields.forEach((field) => {
    if (!field?.id) {
      return
    }
    let schema: Record<string, any> = { type: 'string', title: field.label || field.id }

    if (field.helpText) {
      schema = { ...schema, description: field.helpText }
    }

    if (field.type === 'email') {
      schema = { ...schema, format: 'email' }
    }
    if (field.type === 'number') {
      schema = { type: 'number', title: field.label || field.id }
      if (typeof field.min === 'number') {
        schema.minimum = field.min
      }
      if (typeof field.max === 'number') {
        schema.maximum = field.max
      }
    }
    if (field.type === 'date') {
      schema = { type: 'string', format: 'date', title: field.label || field.id }
    }
    if (field.type === 'checkbox') {
      schema = { type: 'boolean', title: field.label || field.id }
    }
    if (field.type === 'select') {
      schema = { ...schema }
      if (Array.isArray(field.options)) {
        schema.enum = field.options.filter(option => option)
      }
    }

    if (schema.type === 'string') {
      if (typeof field.min === 'number') {
        schema.minLength = field.min
      }
      if (typeof field.max === 'number') {
        schema.maxLength = field.max
      }
      if (field.pattern) {
        schema.pattern = field.pattern
      }
    }

    properties[field.id] = schema
    if (field.required) {
      required.push(field.id)
    }
  })

  const payload: Record<string, any> = {
    type: 'object',
    properties,
  }
  if (required.length) {
    payload.required = required
  }

  return payload
}

export const schemaToFields = (schema: any): FormFieldDefinition[] => {
  if (!schema || typeof schema !== 'object') {
    return []
  }
  const properties = schema.properties || {}
  const required = Array.isArray(schema.required) ? schema.required : []

  return Object.entries(properties).map(([id, fieldSchema]) => {
    const field = fieldSchema as Record<string, any>
    let type = 'shortText'

    if (field.type === 'number') {
      type = 'number'
    }
    else if (field.type === 'boolean') {
      type = 'checkbox'
    }
    else if (field.format === 'email') {
      type = 'email'
    }
    else if (field.format === 'date') {
      type = 'date'
    }
    else if (Array.isArray(field.enum)) {
      type = 'select'
    }
    else if (field.type === 'string' && field.maxLength && field.maxLength > 120) {
      type = 'longText'
    }

    const baseField: FormFieldDefinition = {
      id,
      label: field.title || id,
      type,
      required: required.includes(id),
      options: Array.isArray(field.enum) ? field.enum : [],
    }

    if (typeof field.minimum === 'number') {
      baseField.min = field.minimum
    }
    if (typeof field.maximum === 'number') {
      baseField.max = field.maximum
    }
    if (typeof field.minLength === 'number') {
      baseField.min = field.minLength
    }
    if (typeof field.maxLength === 'number') {
      baseField.max = field.maxLength
    }
    if (field.pattern) {
      baseField.pattern = field.pattern
    }
    if (field.description) {
      baseField.helpText = field.description
    }

    return baseField
  })
}
