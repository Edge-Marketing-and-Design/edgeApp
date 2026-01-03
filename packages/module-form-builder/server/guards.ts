export async function assertFormBuilderEnabled(
  db: { doc: (path: string) => { get: () => Promise<{ exists: boolean, data?: () => { enabled?: boolean } | undefined }> } },
  tenantId: string,
) {
  const snapshot = await db.doc(`tenants/${tenantId}/modules/form-builder`).get()
  if (!snapshot.exists || !snapshot.data?.()?.enabled)
    throw new Error('Form builder module is not enabled for this tenant.')
}
