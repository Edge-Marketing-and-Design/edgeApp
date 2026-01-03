export async function isFormBuilderEnabled(
  db: { doc: (path: string) => { get: () => Promise<{ exists: boolean, data?: () => { enabled?: boolean } | undefined }> } },
  tenantId: string,
) {
  const snapshot = await db.doc(`tenants/${tenantId}/modules/form-builder`).get()
  if (!snapshot.exists)
    return false
  const data = snapshot.data?.() || {}
  return Boolean(data.enabled)
}
