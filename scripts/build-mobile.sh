#!/usr/bin/env bash
set -e

echo "=== Bengal Safety Map: Mobile Build & Verification Utility ==="

TARGET="${1:-test}"

echo "Step 1: Running TypeScript static verification..."
npm --prefix apps/mobile run typecheck

echo "Step 2: Executing Jest test suite..."
npm --prefix apps/mobile test

if [ "$TARGET" = "test" ]; then
    echo "Verification passed successfully!"
    echo "Usage:"
    echo "  ./scripts/build-mobile.sh test        # Run typecheck and jest tests"
    echo "  ./scripts/build-mobile.sh export      # Export standalone JS & assets bundle"
    echo "  ./scripts/build-mobile.sh apk         # Prebuild and compile debug APK (requires Android SDK)"
    exit 0
fi

if [ "$TARGET" = "export" ]; then
    echo "Step 3: Exporting Android production bundle..."
    npx --prefix apps/mobile expo export --platform android --output-dir dist-android
    echo "Export complete: apps/mobile/dist-android"
    exit 0
fi

if [ "$TARGET" = "apk" ]; then
    echo "Step 3: Generating native Android project..."
    npx --prefix apps/mobile expo prebuild --platform android --no-install
    echo "Step 4: Compiling Android APK with Gradle..."
    (cd apps/mobile/android && ./gradlew assembleDebug)
    echo "APK build complete: apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk"
    exit 0
fi

echo "Unknown target: $TARGET. Available options: test, export, apk"
exit 1
