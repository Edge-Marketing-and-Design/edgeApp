export const formBuilderPaths = {
  moduleRecord: 'tenants/{tenantId}/modules/form-builder',
  siteConfig: 'tenants/{tenantId}/sites/{siteId}/modules/form-builder',
  formsCollection: 'tenants/{tenantId}/sites/{siteId}/forms',
  formDoc: 'tenants/{tenantId}/sites/{siteId}/forms/{formId}',
  formResponsesCollection: 'tenants/{tenantId}/sites/{siteId}/forms/{formId}/responses',
} as const
