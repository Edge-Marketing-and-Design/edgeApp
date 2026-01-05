export async function is__MODULE_PASCAL__Enabled(
  db: { doc: (path: string) => { get: () => Promise<{ exists: boolean, data?: () => { enabled?: boolean } | undefined }> } },
  orgId: string,
) {
  const snapshot = await db.doc(`organizations/${orgId}/modules/__MODULE_ID__`).get()
  if (!snapshot.exists)
    return false
  const data = snapshot.data?.() || {}
  return Boolean(data.enabled)
}
