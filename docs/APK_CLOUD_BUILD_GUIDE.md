# PoleSafe Android APK Cloud Build Guide

## What I verified
- Expo project is present in `mobile/`
- Native Android project exists in `mobile/android`
- Expo config is present in `mobile/app.json`
- EAS config is present in `mobile/eas.json`
- EAS CLI is installed and functional in this runtime
- Cloud build attempted and reached Expo/EAS account validation

## What blocked the APK from being generated here
- The Expo account has exhausted Android builds on the current free plan for this month
- The EAS build did upload successfully, but the build did not complete because of the plan limit

## Current APK-oriented config state
- `mobile/eas.json`
  - `preview.android.buildType = "apk"`
  - `production.android.buildType = "apk"`
- `mobile/app.json`
  - Android package: `ug.polesafe.app`
  - EAS project ID is already set
  - runtimeVersion and updates URL are present

## Exact cloud build command used
From `mobile/`:
```bash
npx eas build -p android --profile production --non-interactive
```

## What you need for the cloud APK path to succeed
1. An Expo account with Android build quota available
2. The project linked to the correct Expo account/project
3. Remote Android credentials/keystore configured in EAS
4. The production profile kept as APK output

## Recommended next step
Run the same command again once the Expo build quota resets or after upgrading the Expo/EAS plan:
```bash
cd /data/.openclaw/workspace/polesafe-code/mobile
npx eas build -p android --profile production --non-interactive
```

## Notes
- Local APK generation is blocked here because Java/Android SDK/adb are not available in this runtime
- The repo is already prepared for APK output in the cloud build path
