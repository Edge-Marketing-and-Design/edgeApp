export type FormFieldDefinition = {
  id: string
  label?: string
  type?: string
  required?: boolean
  options?: string[]
}

export const buildSchemaFromFields = (fields: FormFieldDefinition[]) => {
  const properties: Record<string, any> = {}
  const required: string[] = []

  fields.forEach((field) => {
    if (!field?.id) {
      return
    }
    let schema: Record<string, any> = { type: 'string', title: field.label || field.id }

    if (field.type === 'email') {
      schema = { ...schema, format: 'email' }
    }
    if (field.type === 'number') {
      schema = { type: 'number', title: field.label || field.id }
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

    return {
      id,
      label: field.title || id,
      type,
      required: required.includes(id),
      options: Array.isArray(field.enum) ? field.enum : [],
    }
  })
}
