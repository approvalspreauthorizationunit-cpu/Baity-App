# How to Push Updates to the App

## For code changes that don't require a new APK:
Run: npx eas update --channel preview --message "describe your update"
The app will update automatically next time users open it.

## For changes that require a new APK:
(new libraries, app settings changes)
Run: eas build --platform android --profile preview
Wait for build to complete and share new APK link.

## When to use each:
- UI changes → eas update
- New screens → eas update
- New npm packages → new APK build
- App icon/splash changes → new APK build
