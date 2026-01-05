import { describe, expect, it } from 'vitest'
import { buildSchemaFromFields, schemaToFields } from '../packages/module-form-builder/ui/pages/schema-utils'

describe('schema utils', () => {
  it('builds schema for each field type and collects required fields', () => {
    const fields = [
      { id: 'name', label: 'Full name', type: 'shortText', required: true },
      { id: 'bio', label: 'Bio', type: 'longText' },
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'age', label: 'Age', type: 'number', required: false },
      { id: 'role', label: 'Role', type: 'select', options: ['Admin', 'User'] },
      { id: 'approved', label: 'Approved', type: 'checkbox' },
      { id: 'birthDate', label: 'Birth date', type: 'date' },
    ]

    const schema = buildSchemaFromFields(fields)

    expect(schema.type).toBe('object')
    expect(schema.required).toEqual(['name', 'email'])
    expect(schema.properties.name.title).toBe('Full name')
    expect(schema.properties.bio.type).toBe('string')
    expect(schema.properties.email.format).toBe('email')
    expect(schema.properties.age.type).toBe('number')
    expect(schema.properties.role.enum).toEqual(['Admin', 'User'])
    expect(schema.properties.approved.type).toBe('boolean')
    expect(schema.properties.birthDate.format).toBe('date')
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

  it('round-trips fields to schema and back while preserving types and required flags', () => {
    const fields = [
      { id: 'title', label: 'Title', type: 'shortText', required: true },
      { id: 'notes', label: 'Notes', type: 'longText' },
      { id: 'email', label: 'Email', type: 'email' },
      { id: 'count', label: 'Count', type: 'number' },
      { id: 'choice', label: 'Choice', type: 'select', options: ['A', 'B'] },
      { id: 'confirm', label: 'Confirm', type: 'checkbox', required: true },
      { id: 'date', label: 'Date', type: 'date' },
    ]

    const schema = buildSchemaFromFields(fields)
    const roundTripped = schemaToFields(schema)

    expect(roundTripped).toEqual([
      { id: 'title', label: 'Title', type: 'shortText', required: true, options: [] },
      { id: 'notes', label: 'Notes', type: 'shortText', required: false, options: [] },
      { id: 'email', label: 'Email', type: 'email', required: false, options: [] },
      { id: 'count', label: 'Count', type: 'number', required: false, options: [] },
      { id: 'choice', label: 'Choice', type: 'select', required: false, options: ['A', 'B'] },
      { id: 'confirm', label: 'Confirm', type: 'checkbox', required: true, options: [] },
      { id: 'date', label: 'Date', type: 'date', required: false, options: [] },
    ])
  })

  it('detects longText when schema has large maxLength', () => {
    const schema = {
      type: 'object',
      properties: {
        summary: { type: 'string', title: 'Summary', maxLength: 200 },
      },
    }

    const fields = schemaToFields(schema)

    expect(fields).toEqual([
      { id: 'summary', label: 'Summary', type: 'longText', required: false, options: [] },
    ])
  })
})
