# Xcode → TestFlight → App Store: Step-by-Step

This is the full path from "code on GitHub" to "approved on the App Store"
for Opulence Talent Collective. It assumes you have:

- A Mac (required — Xcode is Mac-only)
- An Apple Developer account ($99/yr) with Team ID `937W3FJR9P`
- The project pushed to your own GitHub repo (via Lovable's *Export to GitHub* button)

If you don't have a Mac, skip to **Appendix A: No-Mac options** at the bottom.

---

## Part 1 — One-time Mac setup (≈ 30 min)

### 1.1 Install Xcode
1. Open **App Store** on your Mac → search "Xcode" → Install (it's ~10 GB, takes a while)
2. Launch Xcode once → accept the license → let it finish installing components
3. Open Terminal and run:
   ```bash
   xcode-select --install
   sudo xcodebuild -license accept
   ```

### 1.2 Install Node + CocoaPods
```bash
# If you don't have Homebrew yet:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install node
sudo gem install cocoapods
```

### 1.3 Sign in to Xcode with your Apple ID
1. Xcode → **Settings** (⌘,) → **Accounts** tab
2. Click **+** → **Apple ID** → sign in with the Apple ID tied to your Developer Program
3. You should see your team **"Opulence Talent Collective" (937W3FJR9P)** appear

---

## Part 2 — Pull the project and add iOS (≈ 10 min)

In Terminal:

```bash
# 1. Clone your GitHub repo (replace with your actual URL)
git clone https://github.com/YOUR_USERNAME/opulence-talent-collective.git
cd opulence-talent-collective

# 2. Install JS dependencies
npm install

# 3. Build the production web bundle
npm run build

# 4. Add the iOS native project (only needed once)
npx cap add ios

# 5. Sync the built web assets into the iOS project
npx cap sync ios

# 6. Open in Xcode
npx cap open ios
```

After step 6, **Xcode opens** with `App.xcworkspace`. Wait for it to finish
indexing (bottom bar will show progress).

> **Whenever you pull new code from GitHub later, you only re-run:**
> ```bash
> git pull && npm install && npm run build && npx cap sync ios
> ```

---

## Part 3 — Configure the app in Xcode (≈ 15 min)

In the left sidebar, click the blue **"App"** project at the top, then select
the **"App"** target.

### 3.1 General tab
- **Display Name:** `Opulence Talent Collective`
- **Bundle Identifier:** `com.opulencetalentcollective.app` (already set ✓)
- **Version:** `1.0.0`
- **Build:** `1` (increment this every upload)
- **Minimum Deployments → iOS:** `14.0`

### 3.2 Signing & Capabilities tab
1. Check **"Automatically manage signing"**
2. **Team:** select **"Opulence Talent Collective (937W3FJR9P)"**
3. Xcode will provision a certificate automatically. If you see a red error,
   click **"Try Again"** — usually a one-time hiccup.

Now click **"+ Capability"** (top-left of this tab) and add:

- ✅ **Push Notifications** *(required for APNs)*
- ✅ **Associated Domains** — then click the `+` under Domains and add:
  ```
  applinks:opulencetalentcollective.com
  ```
- ✅ **Background Modes** → check **Remote notifications**

### 3.3 Info tab — privacy strings
Scroll to **Custom iOS Target Properties** and add these keys (right-click → Add Row).
These match permissions the app actually requests; missing strings = instant rejection.

| Key | Value |
|---|---|
| `Privacy - Camera Usage Description` | We use your camera to let you take a profile photo. |
| `Privacy - Photo Library Usage Description` | We use your photo library to let you choose a profile photo or upload verification documents. |
| `Privacy - Photo Library Additions Usage Description` | We save photos to your library only when you explicitly choose to. |

---

## Part 4 — Create the app in App Store Connect (≈ 10 min)

In your browser:

1. Go to https://appstoreconnect.apple.com → **My Apps** → **+** → **New App**
2. Fill in:
   - **Platform:** iOS
   - **Name:** `Opulence Talent Collective`
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** select `com.opulencetalentcollective.app` from the dropdown
     *(if it's not there, you need to register it at developer.apple.com → Identifiers first)*
   - **SKU:** `OTC-IOS-001` (any unique string for your records)
   - **User Access:** Full Access
3. Click **Create**

Now you have a placeholder app. Don't fill in the listing yet — we'll do that
after the build uploads.

---

## Part 5 — Archive and upload to TestFlight (≈ 15 min)

Back in Xcode:

### 5.1 Switch to a real device target
At the top center of Xcode, next to the play button, click the device
dropdown and select **"Any iOS Device (arm64)"**.
*(You cannot archive while a Simulator is selected — Archive option will be greyed out.)*

### 5.2 Archive
- Menu bar: **Product → Archive**
- Xcode will compile for ~3-10 min. Coffee break.
- When done, the **Organizer** window opens automatically showing your archive.

### 5.3 Distribute
1. In Organizer, with your new archive selected, click **Distribute App**
2. Choose **App Store Connect** → Next
3. Choose **Upload** → Next
4. Leave all checkboxes at defaults → Next
5. Choose **Automatically manage signing** → Next
6. Review summary → **Upload**
7. Wait ~5 min for upload + Apple processing.

### 5.4 Verify in App Store Connect
1. Go to https://appstoreconnect.apple.com → your app → **TestFlight** tab
2. Within ~10 min you'll see Build `1.0.0 (1)` appear, initially marked **"Processing"**
3. When processing finishes you may see a yellow ⚠️ next to the build:
   > *"Missing Compliance — Provide export compliance information"*
   Click it → answer **"No"** to "Does your app use encryption?" *(it only uses standard HTTPS, which is exempt)* → Save.

---

## Part 6 — Test on TestFlight (≈ 10 min)

### 6.1 Internal test (yourself only)
1. **TestFlight** tab → **Internal Testing** → **+** → create a group "Internal"
2. Add yourself as a tester (your Apple ID email)
3. Select the build → assign to the group
4. On your iPhone: install the **TestFlight** app from the App Store → sign in with the same Apple ID → your app appears → tap **Install**

### 6.2 What to verify before submitting for review
- [ ] Sign in / sign up flow works
- [ ] Push notification permission prompt appears on first launch (after sign-in)
- [ ] Tap the bell icon → notifications load
- [ ] Send yourself a test push (employer → candidate interview request)
- [ ] Universal Links open the app (tap a `https://opulencetalentcollective.com/talent/xxx` link in Mail/Messages)
- [ ] No crashes on rotation, backgrounding, or low-memory

---

## Part 7 — Submit for App Store Review (≈ 20 min)

1. App Store Connect → your app → **App Store** tab (left sidebar)
2. Fill in everything from `STORE_DESCRIPTION.md`:
   - Subtitle, promotional text, description, keywords, URLs, copyright
   - Upload screenshots (1320 × 2868 px, 3-10 of them)
   - Upload your 1024 × 1024 app icon if not already attached
3. **App Privacy** → fill out the questionnaire per the table in `STORE_DESCRIPTION.md`
4. **Pricing & Availability** → choose Free (your subscriptions are sold via the website)
5. **Build** section → click **+** → select build `1.0.0 (1)`
6. **App Review Information** → paste the reviewer notes from `STORE_DESCRIPTION.md`
   *(remember to set actual passwords for the test accounts!)*
7. **Version Release** → choose "Manually release this version" (so you control the launch date)
8. Top-right: **Add for Review** → **Submit for Review**

Apple typically responds within **24-48 hours**. The most common rejection
reasons are already addressed in your reviewer notes (subscription routing,
test credentials, candidate approval). 🤞

---

## Recurring workflow (every future update)

1. Make changes in Lovable → push to GitHub
2. On your Mac:
   ```bash
   cd opulence-talent-collective
   git pull
   npm install
   npm run build
   npx cap sync ios
   npx cap open ios
   ```
3. In Xcode: bump **Build** number (e.g. 1 → 2) → **Product → Archive** → **Distribute**
4. App Store Connect → TestFlight (smoke test) → submit new version for review

---

## Appendix A — No Mac? Two options

### Option 1: Rent a Mac in the cloud
- **MacInCloud** (https://www.macincloud.com) — ~$1/hr, has Xcode pre-installed
- **MacStadium** — more pro, monthly plans
- Follow this guide identically, just over a remote desktop

### Option 2: Hire someone on Fiverr / Upwork
Search "iOS Capacitor App Store submission" — typical cost $100-300 for a
one-time submission. Give them:
- Access to your GitHub repo (read-only is fine)
- Your Apple Developer account (or invite them as a developer in App Store Connect)
- This document
- `STORE_DESCRIPTION.md`
- Screenshots

---

## Common errors and fixes

| Error in Xcode | Fix |
|---|---|
| "No account for team 937W3FJR9P" | Settings → Accounts → re-add Apple ID |
| "Provisioning profile doesn't include push entitlement" | Capabilities tab → remove and re-add Push Notifications |
| "App Transport Security has blocked..." | Should not happen — `cleartext: true` is now gated behind `CAP_LIVE_RELOAD=1` |
| Archive option greyed out | Top dropdown must be set to **"Any iOS Device (arm64)"**, not a simulator |
| Build stuck on "Processing" >1hr in App Store Connect | Wait — Apple's processing queue can be slow. Email Apple if >24hr. |
| Push notification permission prompt never appears | You must be signed in to a user account first; permission is requested only after auth (see `usePushNotifications.tsx`) |

---

You've got this. Do Part 1 + Part 2 today, then take a break before tackling
the Xcode config. Ping me if anything throws an error — paste the exact
message and I'll diagnose.
