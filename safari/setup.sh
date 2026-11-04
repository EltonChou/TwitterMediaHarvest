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

# The extension needs network access to fetch media and write access to ~/Downloads.
ENTITLEMENTS="$(find "$PROJECT_DIR" -name '*Extension.entitlements' | head -n 1)"
for key in com.apple.security.network.client com.apple.security.files.downloads.read-write; do
  /usr/libexec/PlistBuddy -c "Delete :$key" "$ENTITLEMENTS" >/dev/null 2>&1 || true
  /usr/libexec/PlistBuddy -c "Add :$key bool true" "$ENTITLEMENTS"
done

echo
echo "Done. Open the project with:"
echo "  open \"$(find "$PROJECT_DIR" -maxdepth 2 -name '*.xcodeproj' | head -n 1)\""
