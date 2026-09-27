# Mobile App Release & Distribution Guide

This document details how to develop, test, build, and distribute the **Bengal Safety Map** mobile application (Android APK & AAB) using Expo SDK 52, React Native, and GitHub Actions.

---

## 📱 Mobile Architecture & Stack

- **Framework:** Expo SDK 52 (React Native 0.76.6, New Architecture enabled)
- **Routing:** Expo Router v4 (file-based navigation with tabs and modal timeline route)
- **State Management:** Zustand (`useAppStore` for time filters, area selection, language, offline mode)
- **Server Cache:** TanStack React Query v5
- **Local SQLite / Offline Store:** Local structured bundle cache with SHA-256 verification and stale detection
- **Icons & UI:** Lucide React Native, accessible high-contrast palettes, Safe Area contexts

---

## 🚀 Running the Mobile App Locally

### 1. Install Dependencies

```bash
cd apps/mobile
npm install --legacy-peer-deps
```

### 2. Start the Metro Development Server

```bash
# Start development bundler
npx expo start

# Run on Android Emulator (ensure emulator is booted)
npx expo run:android
# or
npm run android

# Run in Web Browser for fast UI preview
npx expo start --web
```

> **Android Emulator Network Note:**
> In the Android Emulator, `localhost` points to the emulator itself. To connect to the FastAPI backend running on your host machine, use the IP `http://10.0.2.2:8000`. You can configure this easily in the **Settings** tab inside the app.

---

## 🧪 Testing & Verification

Run the automated test suite and TypeScript static verification:

```bash
# 1. Typecheck
npm --prefix apps/mobile run typecheck

# 2. Run Jest Test Suite (Store, Offline Storage, Privacy & Procedural Boundaries)
npm --prefix apps/mobile test

# 3. Or run via helper script
./scripts/build-mobile.sh test
```

---

## 📦 Building Android Release Artifacts (.apk and .aab)

We provide three methods for generating Android releases:

### Method 1: Automated GitHub Actions (Recommended)

The repository includes a production-ready GitHub Actions workflow at `.github/workflows/android-release.yml`.

#### To Build on Demand:
1. Navigate to your repository on GitHub.
2. Go to **Actions** -> **Build Android Release (APK & AAB)**.
3. Click **Run workflow**, choose your branch, and select `build_type`:
   - `apk` — Generates a debug/direct install APK (ready for sideloading).
   - `aab` — Generates an Android App Bundle for Google Play Store upload.
   - `both` — Compiles both artifacts.
4. Once completed (approx. 5–8 minutes), download the artifact from the workflow run summary under **Artifacts**.

#### To Publish an Official GitHub Release with APK Attached:
1. Tag a release commit with semantic versioning:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. The workflow automatically builds the APK, creates a draft/published GitHub Release, and attaches `app-debug.apk` directly to the release page.

---

### Method 2: Local Native Build with Gradle

Requirements: Java Development Kit 17 (JDK 17) and Android SDK / `ANDROID_HOME` configured.

```bash
# 1. Generate the native android project folder
npx --prefix apps/mobile expo prebuild --platform android --no-install

# 2. Build Debug APK (direct install)
cd apps/mobile/android
./gradlew assembleDebug

# Output APK path:
# apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk

# 3. Build Release AAB (Google Play bundle)
./gradlew bundleRelease

# Output AAB path:
# apps/mobile/android/app/build/outputs/bundle/release/app-release.aab
```

---

### Method 3: Cloud Build via EAS (Expo Application Services)

Requirements: Free Expo account and `eas-cli`.

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Authenticate
eas login

# 3. Build APK for testing/sideloading
cd apps/mobile
eas build --platform android --profile preview

# 4. Build AAB for Google Play Store
eas build --platform android --profile production
```

---

## 📥 How to Install the Downloaded APK on an Android Device

1. Download the `.apk` file onto your Android device (from GitHub Releases or the Actions artifact zip).
2. Open the file in your device's File Manager / Downloads.
3. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*:
   - Tap **Settings**.
   - Enable **Allow from this source**.
   - Tap **Back** and proceed with **Install**.
4. Launch **Bengal Safety Map**.
5. Go to **Settings** in the app to configure your backend API URL if not using the production cloud endpoint.

---

## 📋 Release Checklist

Before tagging or distributing a new mobile release:

- [ ] All 11 backend tests pass (`PYTHONPATH=apps/api/src pytest`).
- [ ] Next.js web build completes cleanly (`npm --prefix apps/web run build`).
- [ ] Mobile typecheck passes with 0 errors (`npm --prefix apps/mobile run typecheck`).
- [ ] All 12 mobile unit/boundary tests pass (`npm --prefix apps/mobile test`).
- [ ] Emergency Banner displays toll-free `112` guidance on every screen.
- [ ] Synthetic demo banner is visibly active and non-removable while in demo mode.
- [ ] No PII, accused names, victim names, or exact sensitive coordinates are present in any API response or offline cache bundle.
- [ ] Version and `versionCode` bumped in `apps/mobile/app.json` and `apps/mobile/package.json`.
- [ ] Offline regional packages re-hashed and checksums updated.
