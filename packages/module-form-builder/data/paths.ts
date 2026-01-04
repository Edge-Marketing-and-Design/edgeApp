export const formBuilderPaths = {
  moduleRecord: 'organizations/{orgId}/modules/form-builder',
  siteConfig: 'organizations/{orgId}/sites/{siteId}/modules/form-builder',
  formsCollection: 'organizations/{orgId}/sites/{siteId}/forms',
  formDoc: 'organizations/{orgId}/sites/{siteId}/forms/{formId}',
  formVersionsCollection: 'organizations/{orgId}/sites/{siteId}/formVersions',
  formVersionDoc: 'organizations/{orgId}/sites/{siteId}/formVersions/{versionId}',
  formSubmissionsCollection: 'organizations/{orgId}/sites/{siteId}/formSubmissions',
  formSubmissionDoc: 'organizations/{orgId}/sites/{siteId}/formSubmissions/{submissionId}',
  formIntegrationJobsCollection: 'organizations/{orgId}/sites/{siteId}/formIntegrationJobs',
  formIntegrationJobDoc: 'organizations/{orgId}/sites/{siteId}/formIntegrationJobs/{jobId}',
  formRateLimitsCollection: 'organizations/{orgId}/sites/{siteId}/formRateLimits',
} as const
