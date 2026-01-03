import gt from 'semver/functions/gt'
import lte from 'semver/functions/lte'
import coerce from 'semver/functions/coerce'
import type { EdgeModuleBreakingChange, EdgeModuleManifest } from './types'

const toSemver = (version: string) => coerce(version)

export const getBreakingChanges = (
  manifest: EdgeModuleManifest,
  fromVersion: string,
  toVersion: string,
): EdgeModuleBreakingChange[] => {
  if (!manifest.breakingChanges?.length) {
    return []
  }

  const from = toSemver(fromVersion)
  const to = toSemver(toVersion)
  if (!from || !to) {
    return []
  }

  return manifest.breakingChanges.filter((change) => {
    const changeVersion = toSemver(change.version)
    if (!changeVersion) {
      return false
    }
    return gt(changeVersion, from) && lte(changeVersion, to)
  })
}
