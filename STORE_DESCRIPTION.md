# App Store Listing — Opulence Talent Collective

Copy-paste ready text for App Store Connect (and Google Play). Every field
respects Apple's character limits.

---

## App Name (max 30 chars)
```
Opulence Talent Collective
```
*26 chars ✓*

## Subtitle (max 30 chars)
Pick one — A is the strongest:

- **A.** `Private hiring, done right` *(26 chars)*
- **B.** `Discreet hiring for the few` *(27 chars)*
- **C.** `Where elite talent is found` *(27 chars)*

## Promotional Text (max 170 chars — editable anytime, no review needed)
```
A members-only marketplace connecting elite talent with discerning employers. Discreet introductions, verified profiles, white-glove hiring.
```
*145 chars ✓*

## Keywords (max 100 chars, comma-separated, no spaces after commas)
```
hiring,recruiting,executive,jobs,career,talent,private,vetted,family office,luxury,elite,headhunt
```
*98 chars ✓*

---

## Description (max 4000 chars)

Paste the block below verbatim. It's structured the way Apple reviewers
expect: hook → what it is → who it's for → features → trust signals.

```
Opulence Talent Collective is a members-only marketplace where exceptional talent meets the world's most discerning employers. Whether you are a private family office searching for a head of staff, a boutique firm hiring its next principal, or an individual ready for a role that matches your standards — OTC was built for you.

This is not a job board. Every candidate is personally vetted. Every employer is verified. Introductions are discreet, considered, and made on your terms.

WHY MEMBERS CHOOSE OTC

• Privacy first — Your profile is never indexed publicly. Employers see only what you choose to share.
• Vetted on both sides — Candidates are reviewed by our team before activation. Employers verify their identity and organisation.
• Direct, human introductions — No spammy applications, no auto-rejections. Just relevant matches and real conversations.
• White-glove support — A real person is always one message away.

FOR CANDIDATES

• Build a complete, polished profile with assisted bio writing
• Upload your resume privately — only granted employers can view it
• Receive interview requests and respond on your schedule
• Control exactly who sees your details, and revoke access anytime
• Push notifications keep you informed without checking the app

FOR EMPLOYERS

• Browse a curated directory of pre-vetted candidates
• Save favourites, request resumes, and send interview invitations
• Manage your hiring conversations in one private inbox
• Verified employer badge after identity review
• Membership tiers tailored to your hiring volume

YOUR PRIVACY IS THE PRODUCT

We do not sell data. We do not show ads. We do not track you across other apps. Identity verification documents are encrypted, access-controlled, and deleted when no longer needed. You can request deletion of your account and data at any time.

MEMBERSHIP

OTC is a paid membership service. Subscriptions are managed through our website at opulencetalentcollective.com. The app provides full access to messaging, profile management, and the talent directory once your membership is active.

Need help? Reach us at support@opulencetalentcollective.com or via the in-app contact form.

Welcome to a better way to hire — and to be hired.
```
*~2,250 chars ✓ (well under the 4000 limit)*

---

## URLs

| Field | Value |
|---|---|
| **Support URL** (required) | `https://opulencetalentcollective.com/contact` |
| **Marketing URL** (optional) | `https://opulencetalentcollective.com` |
| **Privacy Policy URL** (required) | `https://opulencetalentcollective.com/privacy` |

---

## Categorisation

- **Primary category:** Business
- **Secondary category:** Lifestyle
- **Age rating:** 17+ (because of unmoderated user-to-user messaging — Apple will flag this if you pick lower)
- **Copyright:** `© 2026 Opulence Talent Collective`

---

## App Review Information (the notes Apple's reviewer will read)

```
This is a members-only hiring marketplace.

To review the app, please use the test credentials below.

TEST EMPLOYER (full access, can browse candidates and send interview requests)
  Email:    review-employer@opulencetalentcollective.com
  Password: [SET BEFORE SUBMISSION]

TEST CANDIDATE (pre-approved, can receive and respond to messages)
  Email:    review-candidate@opulencetalentcollective.com
  Password: [SET BEFORE SUBMISSION]

NOTES FOR THE REVIEWER:
1. Candidate accounts normally require admin approval before sign-in. The test
   candidate above is pre-approved so review can proceed without delay.
2. Subscriptions are sold via the website only (opulencetalentcollective.com).
   The in-app experience does not include payment links or external purchase
   prompts, in line with App Store Review Guideline 3.1.3(a) "Reader" exemption.
3. Push notifications can be triggered by sending an interview request from
   the employer account to the candidate account.
4. All test data is sandboxed and will be cleared after review.

Contact for review questions: support@opulencetalentcollective.com
```

**⚠️ Before submitting:** create those two accounts in production, mark the
candidate as approved, and replace `[SET BEFORE SUBMISSION]` with the actual
passwords.

---

## App Privacy questionnaire

Mirrors `ios/App/App/PrivacyInfo.xcprivacy`. In App Store Connect → App
Privacy, declare these data types:

| Data Type | Linked to user? | Tracking? | Purpose |
|---|---|---|---|
| Email Address | Yes | No | App Functionality |
| Name | Yes | No | App Functionality |
| Phone Number | Yes | No | App Functionality |
| Photos | Yes | No | App Functionality |
| Other User Content (resume, bio) | Yes | No | App Functionality |
| User ID | Yes | No | App Functionality |
| Device ID | Yes | No | App Functionality |
| Crash Data | No | No | App Functionality |

**Tracking across other companies' apps/websites: NO**

---

## Screenshots checklist

You only need ONE iPhone size — Apple scales it for older models.

**REQUIRED: 6.9" (iPhone 16 Pro Max) — 1320 × 2868 px, PNG, no transparency**

3-10 screenshots, in this order:

1. **Hero / sign-in** — tagline-forward, sets the tone
2. **Talent directory** — employer view, shows the curated grid
3. **Talent profile detail** — depth of information, "verified" badge visible
4. **Messaging / interview request** — proves the core interaction
5. **Membership / pricing screen** — *(optional — only if shown in-app)*
6. **Candidate profile editor** — shows the candidate side

Take these from a real iPhone 15/16 Pro Max or the iOS Simulator
(Device → iPhone 16 Pro Max → File → Save Screen).

**Optional iPad (only if you publish for iPad):** 13" (iPad Pro 13") — 2064 × 2752 px

---

## Google Play extras

Most Apple text reuses, but Play needs:

- **Short description** (max 80 chars):
  ```
  Members-only hiring marketplace for elite talent and discerning employers.
  ```
  *76 chars ✓*

- **Feature graphic** (REQUIRED, 1024 × 500 PNG/JPG) — appears as the header
  on your Play Store page. Make this brand-forward: logo + tagline on a dark
  background works well.

- **Phone screenshots** — same as iOS but at 1080 × 1920 (or any 9:16).

---

## Final checklist before you hit Submit

- [ ] Two test accounts created in production with the credentials above
- [ ] Test candidate is pre-approved (admin dashboard → Approval Queue)
- [ ] Privacy policy is live at `/privacy`
- [ ] Contact form is live at `/contact`
- [ ] App icon set (1024×1024 PNG, no transparency, no rounded corners)
- [ ] Screenshots taken at 1320 × 2868 px
- [ ] APNs secrets confirmed in Lovable Cloud (✅ done)
- [ ] Build archived in Xcode and uploaded to App Store Connect
- [ ] Tested once on TestFlight before submitting for review
