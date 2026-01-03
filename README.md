# Edge Firebase Starter
## Setup

```bash
#Run this under current version of node once:
npm install -g --ignore-scripts @edgedev/create-edge-app

#Then run this whenever you want to create a new app:
npx @edgedev/create-edge-app yourappname

#Besides other insturtions for deep links also this:
Need to add this to Info.plist:

    <key>CFBundleURLTypes</key>
    <array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
        <string>com.edgemarketingdesign.offcall</string>
        </array>
        <key>CFBundleURLName</key>
        <string>Offcall App URL</string>
        <key>CFBundleURLTypes</key>
        <array>
        <dict>
            <key>CFBundleURLSchemes</key>
            <array>
            <string>*</string>
            </array>
            <key>CFBundleURLName</key>
            <string>Wildcard</string>
        </dict>
    </array>
    </dict>
    </array>
```

## Module system (local-only)

This repo includes an optional module system to install add-on features into
Edge projects. Modules live in `modules/*` and are installed into a project
using the local `edge` CLI.

Each module provides an `edge-module.json` manifest (or a `package.json` with
`edgeModule` pointing at the manifest). A manifest can:
- add dependencies
- copy template files
- apply JSON merge patches
- insert content between markers
- register a runtime manifest in `edge-modules/registry.ts`

Module installs are tracked via:
- `edgeapp.project.json` (sentinel file that marks an Edge project)
- `.edge/modules/registry.ts` (installed module registry)
- `.edge/modules/<moduleId>.json` (install receipts)
- `edge-modules/registry.ts` (runtime registry used by the app)

### Runtime manifest contract

Each module ships a runtime manifest (copied into `edge-modules/<moduleId>.ts`)
and exposes it as `edgeModule`. The runtime manifest drives UI, permissions,
and lifecycle hooks:

```ts
export const edgeModule = {
  id: 'form-builder',
  version: '1.2.0',
  scope: ['tenant', 'site'],
  compatibility: {
    platform: '>=1.0.0 <2.0.0',
  },
  permissions: ['forms:read', 'forms:write'],
  ui: {
    adminNav: [{ label: 'Forms', to: '/admin/forms' }],
  },
  data: {
    collections: ['forms', 'formSubmissions'],
  },
  lifecycle: {
    install: async (ctx) => {},
    upgrade: async (ctx, fromVersion, toVersion) => {},
    uninstall: async (ctx) => {},
  },
} as const
```

The installer updates `edge-modules/registry.ts` so the app can load all
installed module manifests at runtime.
If you want to enforce EdgeDevFirebase compatibility, pass
`edgeDevFirebaseVersion` into `getModuleAccess`.

### Tenant + site install records

Install state is stored in Firestore:
- `organizations/{orgId}/modules/{moduleId}` (tenant install record)
- `organizations/{orgId}/sites/{siteId}/modules/{moduleId}` (site overrides)

Use the helpers in `composables/edgeModules.ts` to install, upgrade, or toggle
module status (these functions use the Edge Firebase wrapper).

Example tenant record:

```json
{
  "moduleId": "form-builder",
  "installedVersion": "1.2.0",
  "enabled": true,
  "installedAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "config": {},
  "upgradeHistory": []
}
```

### Gatekeeper

Use `getModuleAccess` to enforce:
- module is installed
- tenant enabled
- site enabled (if scope includes `site`)
- compatibility with `edgeapp.project.json` platform version
- permissions and entitlements (when provided)

Update `edgeapp.project.json` when you release breaking platform changes so
compatibility checks stay accurate.

```ts
import { getModuleAccess } from '~/composables/edgeModules'

const access = getModuleAccess({
  edgeFirebase,
  orgId: edgeGlobal.edgeState.currentOrganization,
  siteId: 'default',
  moduleId: 'form-builder',
  userPermissions: edgeFirebase.user?.permissions || [],
})

if (!access.allowed) {
  return
}
```

Server-side gatekeeping is available in `functions/modules-gatekeeper.js` so
Cloud Functions can enforce the same rules.

### Scaffold-time install

You can install modules during project creation:

```bash
npx @edgedev/create-edge-app myapp --modules test-module
```

### Install into an existing project

From a project created with this starter, run:

```bash
pnpm edge module list
pnpm edge module add test-module
pnpm edge module upgrade test-module
```

If you are running directly from this repo, use:

```bash
node ./bin/edge.js module list --project-root .
node ./bin/edge.js module add test-module --project-root .
```

### Enable/disable + upgrades

Use the composables to manage install state:

```ts
import {
  installTenantModule,
  listInstalledModules,
  upgradeTenantModule,
  uninstallTenantModule,
  setTenantModuleEnabled,
  setSiteModuleEnabled,
} from '~/composables/edgeModules'
```

Module upgrades record history in the tenant module document so you can audit
breaking changes and troubleshoot failed migrations.
`uninstallTenantModule` defaults to a soft uninstall (disable + timestamp).

## Testing the module system

You do not need to scaffold a project, but you do need a target directory that
contains `edgeapp.project.json`.

Quick local test (installs into this repo):
```bash
node ./bin/edge.js module list --project-root .
node ./bin/edge.js module add test-module --project-root .
```

Safer test in a throwaway directory (recommended):
```bash
mkdir -p /tmp/edge-module-test
cp ./edgeapp.project.json /tmp/edge-module-test/
node ./bin/edge.js module add test-module \
  --project-root /tmp/edge-module-test \
  --workspace-root /Users/retrograde/Development/edgeApp
```

After install, confirm these files exist in the target:
- `.edge/modules/registry.ts`
- `.edge/modules/test-module.json`
- `edge-modules/registry.ts`
- `edge-modules/pep-talk.ts`
- `plugins/test-module.client.ts`

Run tests with:

```bash
pnpm test
```
