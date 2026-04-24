# Deep Links Setup — OTC Mobile App

This app supports two deep link styles:

| Style | Example | Where it works |
|---|---|---|
| **Universal Links / App Links** | `https://opulencetalentcollective.com/talent/abc123` | Anywhere a URL is clickable — iMessage, Mail, Safari, Chrome, Slack, push notifications. Falls back to opening the website if the app isn't installed. |
| **Custom URL scheme** | `otc://talent/abc123` | Inside other apps that support custom schemes; mostly used as a fallback and for OAuth/auth callbacks. |

The **JavaScript side is fully wired** (`src/components/mobile/NativeNavigationBridge.tsx`) — when iOS or Android hands the app a URL, React Router navigates to the matching path. Hardware back button on Android also pops React Router history and exits cleanly when there's no history left.

What's still needed is the **native verification config**, which can only be generated after you've run `npx cap add ios` / `npx cap add android` locally, because it requires identifiers that don't exist yet.

---

## 1. iOS — Universal Links

### A. Get your Apple Team ID
1. Sign in to https://developer.apple.com/account → **Membership Details**.
2. Copy the **Team ID** (10-character string like `ABCDE12345`).

### B. Update the verification file
Edit `public/.well-known/apple-app-site-association` and replace `TEAMID` with your real Team ID. The `appID` becomes:

```
ABCDE12345.com.opulencetalentcollective.app
```

### C. Confirm the file is served correctly
After publishing, this URL must return JSON with `Content-Type: application/json` (no `.json` extension, no redirects):

```
https://opulencetalentcollective.com/.well-known/apple-app-site-association
```

Lovable hosting serves this automatically because the file is in `public/`.

### D. Add the Associated Domains entitlement in Xcode
1. After `npx cap add ios && npx cap sync ios`, open `ios/App/App.xcworkspace` in Xcode.
2. Select the **App** target → **Signing & Capabilities** → **+ Capability** → **Associated Domains**.
3. Add:
   ```
   applinks:opulencetalentcollective.com
   applinks:www.opulencetalentcollective.com
   ```
4. Make sure your team is selected under **Signing**.

---

## 2. Android — App Links

### A. Generate your release key SHA-256
After you've built a release APK at least once:

```bash
keytool -list -v \
  -keystore /path/to/your-release-key.keystore \
  -alias your-alias-name
```

Copy the **SHA256** line (looks like `AB:CD:12:34:...`).

For testing with debug builds, also grab the debug key:

```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android -keypass android
```

### B. Update the verification file
Edit `public/.well-known/assetlinks.json` and replace `REPLACE:WITH:YOUR:SHA256:FINGERPRINT:HERE` with your real fingerprint(s). You can list multiple fingerprints in the array (release + debug).

### C. Confirm the file is served correctly
After publishing, this URL must return JSON:

```
https://opulencetalentcollective.com/.well-known/assetlinks.json
```

### D. Add intent filters to AndroidManifest.xml
After `npx cap add android && npx cap sync android`, edit `android/app/src/main/AndroidManifest.xml`. Inside the main `<activity>` block, add:

```xml
<!-- Universal App Links (https://) -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="opulencetalentcollective.com" />
    <data android:scheme="https" android:host="www.opulencetalentcollective.com" />
</intent-filter>

<!-- Custom scheme fallback (otc://) -->
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="otc" />
</intent-filter>
```

---

## 3. Test it

After publishing the well-known files and rebuilding the app:

### iOS
```bash
xcrun simctl openurl booted "https://opulencetalentcollective.com/talent/abc123"
xcrun simctl openurl booted "otc://login"
```

### Android
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://opulencetalentcollective.com/talent/abc123"

adb shell am start -W -a android.intent.action.VIEW -d "otc://login"
```

Both should land you on the right screen inside the installed app, not the browser.

### Apple's official validator
Apple maintains a validator that pulls your `apple-app-site-association` file and tells you what's wrong:
https://search.developer.apple.com/appsearch-validation-tool/

### Google's official validator
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://opulencetalentcollective.com&relation=delegate_permission/common.handle_all_urls
```

---

## 4. Routes that are deep-linkable today

| Path | Status |
|---|---|
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | ✅ Live |
| `/dashboard`, `/talent`, `/employer`, `/admin`, `/profile` | ✅ Live (require auth) |
| `/membership`, `/how-it-works`, `/contact`, `/terms`, `/privacy` | ✅ Live |
| `/talent/:id` (individual talent profile) | ⏳ Route doesn't exist yet — when added, it'll deep-link automatically |
| `/apply/talent`, `/apply/employer` | ⏳ Currently scrolls to a section on `/membership` — when split into dedicated routes, they'll deep-link |
