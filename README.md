# Edge Firebase Starter

Nuxt 3 + Vue 3 (SPA mode) starter with Edge components and Firebase integration.

## Requirements
- Node.js (LTS recommended)
- pnpm (recommended) or npm

## Create a new app
```bash
# Run once under your current Node version:
npm install -g --ignore-scripts @edgedev/create-edge-app

# Create a new app:
npx @edgedev/create-edge-app yourappname
```

## Install and run
```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

## Repo structure
- `edge/` shared Edge framework subtree (do not edit directly unless absolutely required)
- `pages/` app routes (use `/pages/app/...` for authenticated app pages)
- `components/` local app components
- `functions/` Firebase Functions (add new files, do not edit shared config files)
- `firestore.rules`, `storage.rules` Firebase rules (do not modify here)

## Keeping the Edge subtree in sync
Use the provided scripts instead of manual edits:
```bash
./edge-status.sh
./edge-pull.sh
./edge-push.sh
```

## Deep links (iOS)
Add URL types to your `Info.plist` when configuring deep links:
```xml
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

## Notes
- Auth/Firestore/Functions/Storage access should go through the injected `edgeFirebase` plugin, not direct SDK imports.
- Prefer Edge components (`edge-dashboard`, `edge-editor`, and `edge/components/shad` wrappers) for UI and data flows.
