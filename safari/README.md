# Safari build

Safari runs web extensions inside a macOS app. Safari's extension API has no
`downloads`, `notifications` or `management`, so this build works differently:

| Feature                                | Chrome / Edge / Firefox          | Safari                                                                                              |
| -------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------- |
| Saving media                           | `downloads.download`             | The app saves to `~/Downloads` ([SafariWebExtensionHandler.swift](SafariWebExtensionHandler.swift)) |
| Download records                       | `downloads.search` / `onChanged` | Stored in `storage.local` ([safariDownloads.ts](../src/libs/safariNative/safariDownloads.ts))       |
| Notifications                          | `notifications.create`           | macOS notification from the app, without buttons                                                    |
| Diagnostics page (extension conflicts) | Yes (Chromium)                   | Hidden                                                                                              |
| "Ask where to save"                    | Save dialog                      | Ignored; files go to `~/Downloads`                                                                  |

## Build and run

You need full Xcode from the App Store (the Command Line Tools alone are not
enough).

```sh
yarn install
cp sample.env dev.env        # development builds read dev.env
yarn build:tools
yarn build:safari:all:dev
sh safari/setup.sh           # generates safari/xcode/
```

Safari will not load an ad-hoc signed build, so the app must be signed with a
team. A free Personal Team works: add your Apple ID in Xcode → Settings →
Accounts, then pick the team for both targets under Signing & Capabilities.
`setup.sh` keeps that team when it regenerates the project (or pass
`TEAM_ID=XXXXXXXXXX`).

Then open the generated `.xcodeproj`, choose the **Media Harvest** scheme, and
run it. In Safari:

1. Settings → Advanced → turn on **Show features for web developers**.
2. Develop → **Allow Unsigned Extensions** (needed each time Safari restarts
   unless the app is signed with your Apple ID team).
3. Settings → Extensions → enable **Media Harvest** and allow it on x.com.

To build from the terminal instead of Xcode:

```sh
xcodebuild -project "safari/xcode/Media Harvest/Media Harvest.xcodeproj" \
  -scheme "Media Harvest" -configuration Debug \
  -derivedDataPath safari/xcode/DerivedData \
  -allowProvisioningUpdates build
open "safari/xcode/DerivedData/Build/Products/Debug/Media Harvest.app"
```

After changing the TypeScript code, run `yarn build:safari:all:dev` and
`sh safari/setup.sh` again (the Xcode project lists each file of the build, so
new files need a regenerated project), then rebuild the app.
