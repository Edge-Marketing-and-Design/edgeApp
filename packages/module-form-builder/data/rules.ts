export const formBuilderRules = `
match /organizations/{orgId}/sites/{siteId}/forms/{formId} {
  allow read: if (hasTenantAccess(orgId) && hasSiteAccess(orgId, siteId)) ||
    (resource.data.visibility in ['public', 'both']);
  allow write: if hasTenantAccess(orgId) && hasSiteAccess(orgId, siteId) && hasPermission('forms:write');
}

match /organizations/{orgId}/sites/{siteId}/formVersions/{versionId} {
  allow read: if (hasTenantAccess(orgId) && hasSiteAccess(orgId, siteId) && hasPermission('forms:read')) ||
    (resource.data.formId != null &&
      get(/databases/$(database)/documents/organizations/$(orgId)/sites/$(siteId)/forms/$(resource.data.formId)).data.visibility in ['public', 'both']);
  allow write: if hasTenantAccess(orgId) && hasSiteAccess(orgId, siteId) && hasPermission('forms:write');
}

match /organizations/{orgId}/sites/{siteId}/formSubmissions/{submissionId} {
  allow read: if hasTenantAccess(orgId) && hasSiteAccess(orgId, siteId) && hasPermission('forms:read');
  allow write: if hasTenantAccess(orgId) && hasSiteAccess(orgId, siteId) && hasPermission('forms:write');
}

match /organizations/{orgId}/sites/{siteId}/formIntegrationJobs/{jobId} {
  allow read: if hasTenantAccess(orgId) && hasSiteAccess(orgId, siteId) && hasPermission('forms:read');
  allow write: if hasTenantAccess(orgId) && hasSiteAccess(orgId, siteId) && hasPermission('forms:write');
}

match /organizations/{orgId}/sites/{siteId}/formRateLimits/{rateLimitId} {
  allow read, write: if false;
}
`
