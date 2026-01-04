import { describe, expect, it } from 'vitest'
import { buildSchemaFromFields, schemaToFields } from '../packages/module-form-builder/ui/pages/schema-utils'

describe('schema utils', () => {
  it('builds schema from field definitions', () => {
    const fields = [
      { id: 'name', label: 'Full name', type: 'shortText', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'age', label: 'Age', type: 'number', required: false },
      { id: 'role', label: 'Role', type: 'select', options: ['Admin', 'User'] },
      { id: 'approved', label: 'Approved', type: 'checkbox' },
    ]

    const schema = buildSchemaFromFields(fields)

    expect(schema.type).toBe('object')
    expect(schema.required).toEqual(['name', 'email'])
    expect(schema.properties.name.title).toBe('Full name')
    expect(schema.properties.email.format).toBe('email')
    expect(schema.properties.age.type).toBe('number')
    expect(schema.properties.role.enum).toEqual(['Admin', 'User'])
    expect(schema.properties.approved.type).toBe('boolean')
  })

  it('converts schema back to field definitions', () => {
    const schema = {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email', title: 'Email address' },
        count: { type: 'number', title: 'Count' },
        choice: { type: 'string', enum: ['A', 'B'], title: 'Choice' },
        confirm: { type: 'boolean', title: 'Confirm' },
      },
    }

    const fields = schemaToFields(schema)

    expect(fields).toEqual([
      { id: 'email', label: 'Email address', type: 'email', required: true, options: [] },
      { id: 'count', label: 'Count', type: 'number', required: false, options: [] },
      { id: 'choice', label: 'Choice', type: 'select', required: false, options: ['A', 'B'] },
      { id: 'confirm', label: 'Confirm', type: 'checkbox', required: false, options: [] },
    ])
  })
})
