#!/bin/sh
# Generates the Xcode project that wraps the Safari build in a macOS app.
# Needs full Xcode (not just the Command Line Tools).
#
#   yarn build:safari:all:dev   # or build:safari:all
#   sh safari/setup.sh
#
# The project references build/safari, so after the first run you only need
# to rebuild the web extension and press Run in Xcode again.
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="$ROOT/build/safari"
PROJECT_DIR="$ROOT/safari/xcode"
APP_NAME="Media Harvest"
BUNDLE_ID="app.mediaharvest.safari"

if [ ! -f "$BUILD/manifest.json" ]; then
  echo "No Safari build found. Run: yarn build:safari:all:dev" >&2
  exit 1
fi

if ! xcrun --find safari-web-extension-converter >/dev/null 2>&1; then
  echo "safari-web-extension-converter not found. Install Xcode from the App Store," >&2
  echo "then run: sudo xcode-select -s /Applications/Xcode.app" >&2
  exit 1
fi

xcrun safari-web-extension-converter "$BUILD" \
  --project-location "$PROJECT_DIR" \
  --app-name "$APP_NAME" \
  --bundle-identifier "$BUNDLE_ID" \
  --macos-only \
  --swift \
  --no-open \
  --no-prompt \
  --force

# Replace the generated native message handler with ours.
HANDLER="$(find "$PROJECT_DIR" -name SafariWebExtensionHandler.swift -not -path "$ROOT/safari/SafariWebExtensionHandler.swift" | head -n 1)"
cp "$ROOT/safari/SafariWebExtensionHandler.swift" "$HANDLER"

# The extension needs network access to fetch media and write access to
# ~/Downloads. Xcode 27 projects (project.xcproj) set the sandbox through
# build settings; older ones use an .entitlements file.
XCPROJ="$(find "$PROJECT_DIR" -name project.xcproj | head -n 1)"
if [ -n "$XCPROJ" ]; then
  python3 - "$XCPROJ" "$BUNDLE_ID" <<'PY'
import re, sys
path, bundle_id = sys.argv[1], sys.argv[2]
text = open(path).read()
# The app's bundle id must prefix the extension's, which the converter
# does not always do.
text = re.sub(r'"PRODUCT_BUNDLE_IDENTIFIER": "[^"]*"(?=,\s*\n\s*"PRODUCT_NAME": "\$\(TARGET_NAME\)",\s*\n\s*"REGISTER_APP_GROUPS")',
              f'"PRODUCT_BUNDLE_IDENTIFIER": "{bundle_id}"', text)
# Grant the extension target network and Downloads access.
start = text.index('"name": "Media Harvest Extension"')
head, tail = text[:start], text[start:]
for key, value in (("ENABLE_OUTGOING_NETWORK_CONNECTIONS", "YES"),
                   ("ENABLE_FILE_ACCESS_DOWNLOADS_FOLDER", "readwrite")):
    if f'"{key}"' not in tail.split('"build-settings": {', 2)[1].split('},', 1)[0]:
        tail = tail.replace('"ENABLE_APP_SANDBOX": "YES",',
                            f'"ENABLE_APP_SANDBOX": "YES",\n        "{key}": "{value}",', 1)
open(path, "w").write(head + tail)
PY
else
  ENTITLEMENTS="$(find "$PROJECT_DIR" -name '*Extension.entitlements' | head -n 1)"
  for key in com.apple.security.network.client com.apple.security.files.downloads.read-write; do
    /usr/libexec/PlistBuddy -c "Delete :$key" "$ENTITLEMENTS" >/dev/null 2>&1 || true
    /usr/libexec/PlistBuddy -c "Add :$key bool true" "$ENTITLEMENTS"
  done
fi

echo
echo "Done. Open the project with:"
echo "  open \"$(find "$PROJECT_DIR" -maxdepth 2 -name '*.xcodeproj' | head -n 1)\""
