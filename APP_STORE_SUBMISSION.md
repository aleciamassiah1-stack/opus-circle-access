# App Store & Play Store Submission Checklist

This checklist gets Opulence Talent Collective from "works on a phone" to
"approved on the App Store / Play Store."

---

## 1. Apple Developer Setup ($99/yr)

- [ ] Sign up at https://developer.apple.com/programs/
- [ ] Create an App ID matching `app.lovable.367c6d40e2e64852a421c1fb20630537`
  (or rename the bundle to something cleaner, e.g. `com.opulencetalentcollective.app`)
- [ ] Enable capabilities on the App ID:
  - Push Notifications
  - Associated Domains (for Universal Links — already configured in code)
  - Sign In with Apple (only if you add Apple sign-in later)
- [ ] Create an APNs Auth Key (`.p8` file) — used for push notifications
- [ ] Create development + distribution certificates
- [ ] Create provisioning profiles (development + App Store)

## 2. Google Play Console ($25 one-time)

- [ ] Sign up at https://play.google.com/console
- [ ] Create the app listing (Internal testing track is fine to start)
- [ ] Generate an upload keystore: `keytool -genkey -v -keystore otc.keystore -alias otc -keyalg RSA -keysize 2048 -validity 10000`
  **Back this file up — losing it means you can never update the app again.**
- [ ] Set up Firebase project for FCM:
  - https://console.firebase.google.com → Add project
  - Add Android app with package `app.lovable.367c6d40e2e64852a421c1fb20630537`
  - Download `google-services.json` → place in `android/app/`
  - Generate a service account JSON: Project Settings → Service Accounts → Generate new private key

---

## 3. Push Notification Secrets (add via Lovable Cloud → Secrets)

Already coded; just need values:

**iOS (APNs)**
- `APNS_KEY_ID` — 10-char key ID from Apple Developer (e.g. `ABC123DEF4`)
- `APNS_TEAM_ID` — 10-char team ID (top-right of Apple Developer site)
- `APNS_BUNDLE_ID` — `app.lovable.367c6d40e2e64852a421c1fb20630537`
- `APNS_AUTH_KEY` — full contents of the `.p8` file (paste including `-----BEGIN PRIVATE KEY-----`)

**Android (FCM)**
- `FCM_SERVICE_ACCOUNT` — entire JSON of the Firebase service account, pasted as a single string

---

## 4. App Store Listing Metadata

### Required text
- **App name** (max 30 chars): `Opulence Talent Collective`
- **Subtitle** (max 30 chars): `Private hiring for excellence`
- **Promotional text** (max 170 chars, can change anytime):
  > A members-only marketplace connecting elite talent with discerning employers. Discreet introductions, verified profiles, white-glove hiring.
- **Description** (max 4000 chars): see `STORE_DESCRIPTION.md` (write a long version)
- **Keywords** (max 100 chars, comma-separated):
  `hiring,recruiting,executive,jobs,career,talent,private,vetted,family office,luxury`
- **Support URL**: https://opulencetalentcollective.com/contact
- **Marketing URL** (optional): https://opulencetalentcollective.com
- **Privacy Policy URL** (REQUIRED): https://opulencetalentcollective.com/privacy
- **Copyright**: `© 2026 Opulence Talent Collective`
- **Primary category**: Business
- **Secondary category**: Lifestyle

### Required screenshots (PNG, no transparency)

Take from a real iPhone or Simulator. Apple now accepts ONE size and scales:

- **6.9"** (iPhone 16 Pro Max): 1320 × 2868 — **REQUIRED**, 3-10 screenshots
- **6.5"** (iPhone 11 Pro Max / 8 Plus equivalent): 1242 × 2688 — *only if 6.9" not provided*

For iPad (only if you intend to publish for iPad):
- **13"** (iPad Pro 13"): 2064 × 2752

Recommended screenshot order:
  1. Hero / sign-in screen with tagline
  2. Talent directory (employer view)
  3. Talent profile detail
  4. Messaging / interview request
  5. Membership / pricing
  6. Profile editor (candidate view)

### App icon
- Already set up via `capacitor-assets` if you ran `npx capacitor-assets generate`
- Source: 1024×1024 PNG, no transparency, no rounded corners

### App Privacy questionnaire (App Store Connect)
Mirrors `ios/App/App/PrivacyInfo.xcprivacy`. Declare:
- Email Address — Linked, App Functionality
- Name — Linked, App Functionality
- Phone Number — Linked, App Functionality
- Photos — Linked, App Functionality
- Other User Content — Linked, App Functionality
- User ID — Linked, App Functionality
- Device ID — Linked, App Functionality
- Crash Data — NOT linked, App Functionality
- Tracking: **No**

### App Review notes (under "App Review Information")
> This is a members-only marketplace. To review, please use the test
> credentials below. Subscriptions are sold via the website only — the
> in-app experience does not include payment links, in line with App
> Store Review Guideline 3.1.3(a) "Reader" exemption.
>
> **Test employer**: review-employer@example.com / [password]
> **Test candidate**: review-candidate@example.com / [password]
>
> Note: candidate accounts require admin approval before they can sign
> in fully. The test candidate above is pre-approved.

---

## 5. Google Play Listing Metadata

### Required text
- **App name** (max 30 chars): `Opulence Talent Collective`
- **Short description** (max 80 chars):
  > Members-only hiring marketplace for elite talent and discerning employers.
- **Full description** (max 4000 chars): same as App Store
- **Email**: support@opulencetalentcollective.com (or whatever you use)
- **Privacy Policy URL**: https://opulencetalentcollective.com/privacy

### Required graphics
- **App icon**: 512 × 512 PNG, 32-bit, ≤1MB
- **Feature graphic**: 1024 × 500 PNG/JPG (REQUIRED — shows in Play Store header)
- **Phone screenshots**: 1080 × 1920 (or 9:16), min 2, max 8
- **7" tablet** (optional): 1024 × 600
- **10" tablet** (optional): 1280 × 800

### Data safety form
Mirror the iOS App Privacy questionnaire above.

### Content rating
Take the Play Console questionnaire. For OTC, expect **Everyone** or **Mature 17+**
depending on whether messaging is treated as "user-generated content with
moderation."

---

## 6. Build & Submit

After secrets are added and you have signing materials:

```bash
# Pull latest code, install deps, sync native
git pull
npm install
npm run build
npx cap sync

# iOS
npx cap open ios
# In Xcode: Product → Archive → Distribute App → App Store Connect

# Android
cd android
./gradlew bundleRelease
# Upload android/app/build/outputs/bundle/release/app-release.aab to Play Console
```

---

## 7. Post-submission

- **Apple review**: typically 24-48 hours. Common rejections:
  - Missing privacy policy URL
  - Missing demo credentials in review notes
  - Subscription buttons visible inside app (we already gate this — verify on TestFlight before submission)
- **Google review**: typically a few hours to a few days
- **TestFlight**: use this to test push notifications on real devices before
  going to App Review

---

## Files in this repo that support submission

- `ios/App/App/PrivacyInfo.xcprivacy` — Apple privacy manifest
- `public/.well-known/apple-app-site-association` — iOS Universal Links config
- `public/.well-known/assetlinks.json` — Android App Links config
- `capacitor.config.ts` — splash, status bar, custom URL scheme
- `DEEP_LINKS_SETUP.md` — instructions for native project deep link wiring
