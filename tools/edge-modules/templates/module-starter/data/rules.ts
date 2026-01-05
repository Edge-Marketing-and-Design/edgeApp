export const __MODULE_CAMEL__Rules = `
match /organizations/{orgId}/sites/{siteId}/__MODULE_ID__Records/{recordId} {
  allow read: if hasTenantAccess(orgId) && hasSiteAccess(orgId, siteId) && hasPermission('__MODULE_ID__:read');
  allow write: if hasTenantAccess(orgId) && hasSiteAccess(orgId, siteId) && hasPermission('__MODULE_ID__:write');
}
`
