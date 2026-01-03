export const formBuilderRules = `
match /tenants/{tenantId}/sites/{siteId}/forms/{formId} {
  allow read: if hasTenantAccess(tenantId) && hasSiteAccess(tenantId, siteId);
  allow write: if hasTenantAccess(tenantId) && hasSiteAccess(tenantId, siteId) && hasPermission('forms:write');

  match /responses/{responseId} {
    allow create: if true;
    allow read: if hasTenantAccess(tenantId) && hasSiteAccess(tenantId, siteId) && hasPermission('forms:read');
  }
}
`
