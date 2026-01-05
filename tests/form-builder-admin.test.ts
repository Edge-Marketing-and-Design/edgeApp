import { fireEvent, render, screen } from '@testing-library/vue'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FormBuilderAdmin from '../packages/module-form-builder/ui/pages/FormBuilderAdmin.vue'
import * as schemaUtils from '../packages/module-form-builder/ui/pages/schema-utils'

const EdgeShadButton = defineComponent({
  emits: ['click'],
  template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
})

const EdgeShadInput = defineComponent({
  props: {
    modelValue: { type: [String, Number], default: '' },
    name: { type: String, default: '' },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  template: `
    <label>
      <span v-if="label">{{ label }}</span>
      <input
        :name="name"
        :aria-label="label || name"
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </label>
  `,
})

const EdgeGInput = defineComponent({
  props: {
    modelValue: { type: [String, Number, Boolean, Array], default: '' },
    name: { type: String, default: '' },
    label: { type: String, default: '' },
    fieldType: { type: String, default: 'text' },
    items: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue'],
  template: `
    <label>
      <span v-if="label">{{ label }}</span>
      <textarea
        v-if="fieldType === 'textarea'"
        :name="name"
        :aria-label="label || name"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <select
        v-else-if="fieldType === 'select'"
        :name="name"
        :aria-label="label || name"
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-for="item in items" :key="item" :value="item">{{ item }}</option>
      </select>
      <input
        v-else-if="fieldType === 'boolean'"
        type="checkbox"
        :name="name"
        :aria-label="label || name"
        :checked="Boolean(modelValue)"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <input
        v-else
        :name="name"
        :aria-label="label || name"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </label>
  `,
})

const EdgeForm = defineComponent({
  template: '<form><slot /></form>',
})

const DraggableStub = defineComponent({
  name: 'Draggable',
  props: {
    modelValue: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue'],
  setup(props, { slots }) {
    return () => h('div', {}, (props.modelValue as Array<any>).map((element, index) => (
      slots.item ? slots.item({ element, index }) : null
    )))
  },
})

const createRenderOptions = (overrides?: { edgeFirebase?: any }) => {
  const orgId = 'org-1'
  const siteId = 'site-1'
  const formsPath = `organizations/${orgId}/sites/${siteId}/forms`
  const versionsPath = `organizations/${orgId}/sites/${siteId}/formVersions`

  const edgeFirebase = overrides?.edgeFirebase || {
    data: {
      [`organizations/${orgId}/sites`]: {
        [siteId]: { name: 'Site 1' },
      },
      [formsPath]: {
        'contact-form': {
          name: 'Contact',
          description: 'Reach us',
          status: 'draft',
          visibility: 'authenticated',
          activeVersionId: 'contact-form-v1',
        },
      },
      [versionsPath]: {
        'contact-form-v1': {
          id: 'contact-form-v1',
          formId: 'contact-form',
          version: 1,
          schema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
            },
          },
          uiSchema: {},
        },
      },
    },
    startSnapshot: vi.fn().mockResolvedValue(undefined),
    storeDoc: vi.fn().mockResolvedValue(undefined),
  }

  const edgeGlobal = {
    edgeState: {
      currentOrganization: orgId,
      organizationDocPath: `organizations/${orgId}`,
    },
  }

  return {
    edgeFirebase,
    edgeGlobal,
    orgId,
    siteId,
    formsPath,
    versionsPath,
  }
}

describe('FormBuilderAdmin', () => {
  it('starts snapshots for forms and versions when a site is selected', async () => {
    const { edgeFirebase, orgId, siteId, formsPath, versionsPath } = createRenderOptions()

    render(FormBuilderAdmin, {
      global: {
        provide: { edgeFirebase, edgeGlobal: { edgeState: { currentOrganization: orgId, organizationDocPath: `organizations/${orgId}` } } },
        components: {
          'edge-shad-button': EdgeShadButton,
          'edge-shad-input': EdgeShadInput,
          'edge-g-input': EdgeGInput,
          'edge-form': EdgeForm,
          draggable: DraggableStub,
        },
      },
    })

    await flushPromises()

    expect(edgeFirebase.startSnapshot).toHaveBeenCalledWith(`organizations/${orgId}/sites`)
    expect(edgeFirebase.startSnapshot).toHaveBeenCalledWith(formsPath)
    expect(edgeFirebase.startSnapshot).toHaveBeenCalledWith(versionsPath)
  })

  it('creates a form and version when submitting the create form panel', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T08:00:00.000Z'))

    const { edgeFirebase } = createRenderOptions({
      edgeFirebase: {
        data: {
          'organizations/org-1/sites': {
            'site-1': { name: 'Site 1' },
          },
        },
        startSnapshot: vi.fn().mockResolvedValue(undefined),
        storeDoc: vi.fn().mockResolvedValue(undefined),
      },
    })

    render(FormBuilderAdmin, {
      global: {
        provide: {
          edgeFirebase,
          edgeGlobal: { edgeState: { currentOrganization: 'org-1', organizationDocPath: 'organizations/org-1' } },
        },
        components: {
          'edge-shad-button': EdgeShadButton,
          'edge-shad-input': EdgeShadInput,
          'edge-g-input': EdgeGInput,
          'edge-form': EdgeForm,
          draggable: DraggableStub,
        },
      },
    })

    await flushPromises()

    await fireEvent.click(screen.getByRole('button', { name: 'New form' }))
    await fireEvent.update(screen.getByLabelText('Name'), 'Customer Intake')
    await fireEvent.update(screen.getByLabelText('Description'), 'Tell us about your request')
    await fireEvent.click(screen.getByRole('button', { name: 'Create form' }))

    await flushPromises()

    expect(edgeFirebase.storeDoc).toHaveBeenNthCalledWith(
      1,
      'organizations/org-1/sites/site-1/formVersions',
      expect.objectContaining({
        docId: 'customer-intake-v1',
        formId: 'customer-intake',
        version: 1,
        createdAt: '2024-01-01T08:00:00.000Z',
      }),
    )
    expect(edgeFirebase.storeDoc).toHaveBeenNthCalledWith(
      2,
      'organizations/org-1/sites/site-1/forms',
      expect.objectContaining({
        docId: 'customer-intake',
        name: 'Customer Intake',
        activeVersionId: 'customer-intake-v1',
        createdAt: '2024-01-01T08:00:00.000Z',
      }),
    )

    vi.useRealTimers()
  })

  it('switches between JSON and fields modes using schema conversions', async () => {
    const { edgeFirebase, edgeGlobal } = createRenderOptions()
    const schemaSpy = vi.spyOn(schemaUtils, 'schemaToFields')

    render(FormBuilderAdmin, {
      global: {
        provide: { edgeFirebase, edgeGlobal },
        components: {
          'edge-shad-button': EdgeShadButton,
          'edge-shad-input': EdgeShadInput,
          'edge-g-input': EdgeGInput,
          'edge-form': EdgeForm,
          draggable: DraggableStub,
        },
      },
    })

    await flushPromises()

    await fireEvent.click(screen.getByRole('button', { name: 'JSON' }))
    const schemaInput = screen.getByLabelText('Schema JSON') as HTMLTextAreaElement
    expect(schemaInput.value).toContain('email')

    await fireEvent.update(schemaInput, JSON.stringify({
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }, null, 2))

    await fireEvent.click(screen.getByRole('button', { name: 'Fields' }))
    await flushPromises()

    expect(schemaSpy).toHaveBeenCalled()

    schemaSpy.mockRestore()
  })

  it('saves a new version with the next version number', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-02-01T10:00:00.000Z'))

    const orgId = 'org-1'
    const siteId = 'site-1'
    const formsPath = `organizations/${orgId}/sites/${siteId}/forms`
    const versionsPath = `organizations/${orgId}/sites/${siteId}/formVersions`

    const edgeFirebase = {
      data: {
        [`organizations/${orgId}/sites`]: {
          [siteId]: { name: 'Site 1' },
        },
        [formsPath]: {
          'contact-form': {
            name: 'Contact',
            description: 'Reach us',
            status: 'draft',
            visibility: 'authenticated',
            activeVersionId: 'contact-form-v2',
          },
        },
        [versionsPath]: {
          'contact-form-v1': {
            id: 'contact-form-v1',
            formId: 'contact-form',
            version: 1,
            schema: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
              },
            },
            uiSchema: {},
          },
          'contact-form-v2': {
            id: 'contact-form-v2',
            formId: 'contact-form',
            version: 2,
            schema: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
              },
            },
            uiSchema: {},
            integrations: [{ type: 'webhook' }],
          },
        },
      },
      startSnapshot: vi.fn().mockResolvedValue(undefined),
      storeDoc: vi.fn().mockResolvedValue(undefined),
    }

    render(FormBuilderAdmin, {
      global: {
        provide: {
          edgeFirebase,
          edgeGlobal: { edgeState: { currentOrganization: orgId, organizationDocPath: `organizations/${orgId}` } },
        },
        components: {
          'edge-shad-button': EdgeShadButton,
          'edge-shad-input': EdgeShadInput,
          'edge-g-input': EdgeGInput,
          'edge-form': EdgeForm,
          draggable: DraggableStub,
        },
      },
    })

    await flushPromises()

    await fireEvent.click(screen.getByRole('button', { name: 'Save new version' }))
    await flushPromises()

    expect(edgeFirebase.storeDoc).toHaveBeenNthCalledWith(
      1,
      versionsPath,
      expect.objectContaining({
        docId: 'contact-form-v3',
        formId: 'contact-form',
        version: 3,
        createdAt: '2024-02-01T10:00:00.000Z',
      }),
    )
    expect(edgeFirebase.storeDoc).toHaveBeenNthCalledWith(
      2,
      formsPath,
      expect.objectContaining({
        docId: 'contact-form',
        activeVersionId: 'contact-form-v3',
        updatedAt: '2024-02-01T10:00:00.000Z',
      }),
    )

    vi.useRealTimers()
  })
})
