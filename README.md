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
