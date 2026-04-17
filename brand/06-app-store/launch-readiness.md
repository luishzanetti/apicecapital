# App Store Launch Readiness Checklist — Apice Capital

> **Author:** @analyst (Atlas)
> **Owner at launch:** @pm (Morgan) with @devops (Gage) executing submission
> **Date:** 2026-04-17
> **Scope:** Everything required to go from "app built" to "app live in App Store and Google Play." Covers metadata, assets, legal, support, technical infrastructure, marketing coordination, and team ownership.
> **Gate rule:** No field marked REQUIRED can be left blank or placeholder. A single missing disclosure can block Apple review by 2–7 days.

---

## 1. App Store metadata (App Store Connect)

### Primary identity
- [ ] **App Name:** `Apice: Build Wealth Weekly` (25 chars) — confirmed per `listing-copy-EN-US.md §1` | Owner: @pm
- [ ] **Subtitle:** `DCA, AI Experts & Academy.` (26 chars) | Owner: @pm
- [ ] **Bundle ID:** `capital.apice.app` (or confirmed final) — **must match code-signing** | Owner: @devops
- [ ] **SKU:** internal ID in App Store Connect (e.g., `APICE-IOS-V1`) | Owner: @devops
- [ ] **Primary language:** English (U.S.) | Owner: @pm
- [ ] **Content Rights:** Confirm "Does Your App Contain, Show, or Access Third-Party Content?" — YES (crypto market data, Bybit integration); disclose providers | Owner: @pm

### Localized metadata (en-US primary)
- [ ] Promotional Text (170 chars) per `listing-copy-EN-US.md §3` | Owner: @pm
- [ ] Description (~4000 chars) per `listing-copy-EN-US.md §4` | Owner: @pm
- [ ] Keywords field (100 chars) per `listing-copy-EN-US.md §5` | Owner: @pm
- [ ] What's New v1.0 (170 chars) per `listing-copy-EN-US.md §6` | Owner: @pm
- [ ] Marketing URL: `https://apice.capital` | Owner: @pm
- [ ] Support URL: `https://apice.capital/support` | Owner: @pm
- [ ] Privacy Policy URL: `https://apice.capital/privacy` (REQUIRED) | Owner: @pm

### Localized metadata (es-MX — secondary at launch)
- [ ] All fields duplicated in App Store Connect `Spanish (Mexico)` locale per `listing-copy-ES.md` | Owner: @pm
- [ ] Localized Privacy Policy URL (if different) | Owner: @pm

### Category
- [ ] Primary Category: `Finance` | Owner: @pm
- [ ] Secondary Category: `Education` | Owner: @pm

### Age Rating (completed via questionnaire)
- [ ] Age Rating questionnaire completed — expected outcome **17+** (due to unrestricted access to financial content + crypto trading) | Owner: @pm
- [ ] Disclose: Simulated Gambling = NO, Realistic Violence = NO, Profanity = NO, Drugs/Alcohol = NO
- [ ] Disclose: **Unrestricted Web Access** = likely NO (in-app content only), **Gambling** = NO (DCA is not gambling), **Professionally/Medically Treated** = NO

### Pricing & Availability
- [ ] App itself: FREE | Owner: @pm
- [ ] In-app purchases configured in App Store Connect (see §5 Technical) | Owner: @devops
- [ ] Availability: Start with `United States` only for first 5 days, expand per `aso-strategy.md §5.1` | Owner: @pm
- [ ] Pre-orders: NOT recommended — ship when ready, avoid pre-order debt | Owner: @pm

### Review Information
- [ ] First Name / Last Name / Phone / Email of review contact (CEO or @pm) | Owner: @pm
- [ ] Demo account credentials for Apple Review (test user with realistic data: connected Bybit account, sample DCA plan, Foundation track 40% complete) | Owner: @dev + @qa
- [ ] Notes for reviewer:
  > "Apice requires a connected funding source for full functionality. Use the demo account credentials above — it has a pre-seeded DCA plan, 3 Academy lessons completed, and 2 AI Expert sessions. No external actions (wire, withdrawal, real money movement) are required for review. DCA execution in demo account is simulated."
- [ ] Attached documentation: compliance letters from Bybit partnership confirming Apice's operational status (may be requested by reviewer) | Owner: @devops

---

## 2. Google Play Store metadata (Google Play Console)

### Primary identity
- [ ] **App Name:** `Apice: Build Wealth Weekly` (30 chars) | Owner: @pm
- [ ] **Short Description** (80 chars): `Automated weekly DCA, six AI experts, and the Academy. Build wealth, weekly.` (76 chars) | Owner: @pm
- [ ] **Full Description** (4,000 chars) per EN-US listing copy | Owner: @pm
- [ ] **App Category:** Finance | Owner: @pm
- [ ] **Tags:** Investing, Education, Cryptocurrency | Owner: @pm

### Contact & compliance
- [ ] Developer email (publicly visible): `hello@apice.capital` | Owner: @pm
- [ ] Developer website: `https://apice.capital` | Owner: @pm
- [ ] Privacy Policy URL | Owner: @pm
- [ ] Target audience: 18+ | Owner: @pm
- [ ] Declare financial features (Google Play requires disclosure of real-money transactions) | Owner: @devops

### Content rating (IARC questionnaire)
- [ ] Expected outcome: PEGI 16 / ESRB Mature 17+ (due to financial products) | Owner: @pm

### Data safety (Google Play equivalent to App Privacy)
- [ ] Declare data collection categories (mirror Apple Privacy Nutrition Label) | Owner: @pm
- [ ] Data encrypted in transit: YES | Owner: @dev
- [ ] Data deletion on request: YES (link to support page) | Owner: @dev

---

## 3. Visual assets

### App icon
- [ ] iOS app icon set (all required sizes — 1024, 180, 120, 87, 80, 60, 58, 40, 29, 20) rendered from V3.01 logo master | Owner: @ux-design-expert + @media-engineer
- [ ] Android adaptive icon (foreground + background layer, 108×108 dp) | Owner: @media-engineer
- [ ] Favicon for `apice.capital` (for consistency on linked web pages) | Owner: @dev
- [ ] Notification icon variant (monochrome) for Android — CRITICAL, often missed | Owner: @dev

### Screenshots
- [ ] **iOS 6.9"** — 7 screenshots × EN-US + ES-MX = 14 assets | Owner: @media-engineer per `screenshot-brief.md`
- [ ] **iOS 6.5"** — auto-inherit from 6.9" (Apple recommended) | Owner: @media-engineer
- [ ] **iOS 5.5"** — 7 screenshots × 2 locales = 14 assets (only if targeting iOS <17) | Owner: @media-engineer
- [ ] **iPad 12.9"** — 7 screenshots × 2 locales = 14 assets | Owner: @media-engineer
- [ ] **Android phone (1080 × 1920)** — 7 × 2 locales = 14 | Owner: @media-engineer
- [ ] **Google Play Feature Graphic (1024 × 500)** — 1 master + ES variant | Owner: @media-engineer

### App Preview Video (OPTIONAL for launch, RECOMMENDED for Month 2)
- [ ] Not in scope for launch day
- [ ] 15–30s video, portrait, captures "open app → start DCA plan → see Academy" flow | Owner: @media-engineer (Month 2 deliverable)

---

## 4. Legal & compliance

### Privacy
- [ ] **Privacy Policy** published at `apice.capital/privacy` | Owner: @pm + legal counsel
- [ ] Privacy Policy covers: data collected, storage region, third-party processors (Bybit, Supabase, Sentry, PostHog), user rights (access, deletion, portability), retention, contact | Owner: legal counsel
- [ ] Privacy Policy translated to ES (for ES-MX listing) | Owner: legal counsel
- [ ] GDPR-compliant for EU visitors (even if not initially targeted) | Owner: legal counsel
- [ ] CCPA-compliant for California residents (required since we launch US-first) | Owner: legal counsel
- [ ] **Data deletion request flow** working end-to-end (required by Apple and Google) | Owner: @dev + @pm

### Terms of Service
- [ ] **Terms of Service** published at `apice.capital/terms` | Owner: legal counsel
- [ ] Covers: user eligibility (18+, residency), subscription terms (auto-renewal, cancellation), financial product risk disclosures, limitation of liability, governing law, arbitration | Owner: legal counsel
- [ ] Translated to ES | Owner: legal counsel
- [ ] Linked from in-app onboarding (REQUIRED — Apple Guideline 3.1.2) | Owner: @dev

### Financial product disclosures
- [ ] **Risk disclosure** visible before first DCA plan activation (Apple 5.1.1 + regulatory requirement): "Crypto assets carry material risk. Past performance does not guarantee future results. Apice Capital does not provide personalized investment advice." | Owner: legal counsel + @dev
- [ ] Risk language matches what's in the App Store description §4 | Owner: @pm
- [ ] Bybit partnership disclosed in-app and on website "Powered by Bybit" | Owner: @pm
- [ ] Regulatory disclosures per jurisdiction (US: no SEC/FINRA claim made; LATAM: country-specific) | Owner: legal counsel

### Trademarks
- [ ] Wordmark `Apice.` filed (at minimum provisionally) in US + primary LATAM markets | Owner: legal counsel
- [ ] Phrase `"Build wealth. One week at a time."` filed as service mark | Owner: legal counsel
- [ ] AI Expert names (Nora, Kai, Elena, Dante, Maya, Omar) do NOT require trademark individually (too generic) but the **set as "The Six"** could be protected as collective branding | Owner: legal counsel

### Export compliance
- [ ] Declare encryption usage (Apple requires export classification) — Apice uses standard TLS/HTTPS encryption (exempt category) | Owner: @devops
- [ ] ECCN classification: `5D002` typical; self-classification declaration in App Store Connect | Owner: @devops

---

## 5. Technical infrastructure

### In-App Purchase (IAP) setup
- [ ] **Subscription group** created in App Store Connect: `Apice Premium` | Owner: @devops
- [ ] **Apice Pro** — $4.99/mo auto-renewable subscription configured | Owner: @devops
- [ ] **Apice Club** — $14.99/mo auto-renewable subscription configured | Owner: @devops
- [ ] Subscription tier hierarchy: Free → Pro → Club (Club supersedes Pro, upgrade/crossgrade paths tested) | Owner: @dev
- [ ] Introductory offer configured if desired (e.g., 7-day free trial for Club) — decision required from CEO
- [ ] StoreKit 2 integration tested in sandbox (purchase, restore, upgrade, downgrade, cancel flows) | Owner: @dev + @qa
- [ ] Receipt validation on server-side | Owner: @dev
- [ ] Subscription status sync with Supabase user profile | Owner: @dev
- [ ] Family Sharing: disable (financial products should not share) | Owner: @pm
- [ ] **Pricing tension NOTE:** Above assumes Path B ($4.99/$14.99) — if CEO approves Path A ($49.90/$149.90), update IAP tiers before ship | Owner: @pm
- [ ] Google Play Billing Library equivalent setup (BillingClient 6+) | Owner: @dev

### Universal Links / Deep Links
- [ ] iOS Universal Links configured — `apple-app-site-association` file at `apice.capital/.well-known/apple-app-site-association` | Owner: @devops
- [ ] Android App Links configured — `assetlinks.json` at `apice.capital/.well-known/assetlinks.json` | Owner: @devops
- [ ] Deep link routes tested: `/dca`, `/academy/foundation/l1`, `/experts/nora`, `/plan/:planId` | Owner: @dev

### Push notifications
- [ ] APNs certificates uploaded to App Store Connect | Owner: @devops
- [ ] FCM project configured for Android | Owner: @devops
- [ ] Notification permission request copy reviewed for brand voice | Owner: @pm
- [ ] Initial notification strategy: fund-low alerts, streak-break warnings (per V2-MASTER-PLAN §3.3) | Owner: @pm

### Widgets & platform integrations
- [ ] iOS WidgetKit home-screen widget for portfolio total — DEFER to Month 2 (not launch blocker) | Owner: @dev
- [ ] Live Activities for DCA execution confirmations — DEFER to Month 3 | Owner: @dev
- [ ] Apple Watch companion — DEFER to Month 6 | Owner: @dev

### Accessibility (REQUIRED to avoid editorial rejection)
- [ ] VoiceOver labels on all interactive elements | Owner: @dev + @qa
- [ ] Dynamic Type supported (Larger Text) | Owner: @dev
- [ ] Dark Interface (native — we ship dark-only or dark-default with light toggle) | Owner: @dev
- [ ] Differentiate Without Color Alone (status indicators use icons + color, not color only) | Owner: @dev + @ux-design-expert
- [ ] Sufficient Contrast ratios per WCAG AA | Owner: @qa via ECC `a11y-architect`
- [ ] Reduced Motion respected | Owner: @dev

### Performance & reliability gates
- [ ] Cold start time <2 seconds on iPhone 12+ | Owner: @dev
- [ ] Crash-free session rate ≥99.5% in final 48h pre-submit | Owner: @qa
- [ ] Sentry/crash reporting integrated and monitored | Owner: @devops
- [ ] Feature flags configured (LaunchDarkly or similar) for emergency kill-switch on risky flows | Owner: @devops

---

## 6. Support infrastructure

- [ ] **Support email:** `support@apice.capital` — monitored 24 hours at launch | Owner: @pm
- [ ] **Support website:** `apice.capital/support` with FAQ categories (Account, DCA Plans, AI Experts, Academy, Billing, Security) | Owner: @pm
- [ ] **FAQ launch set:** minimum 20 questions covering the top installation/onboarding/billing concerns | Owner: @pm
- [ ] **In-app Help Center** linked from Settings → Help | Owner: @dev
- [ ] **On-call rotation:** @dev + @pm rotate Week 1 to handle launch tickets within 4 hours | Owner: @pm
- [ ] **Escalation runbook:** decision tree for when issue = bug vs. user error vs. regulatory vs. security | Owner: @pm + @qa

---

## 7. Marketing coordination

### Launch day (T=0)
- [ ] Website `apice.capital` updated with "Now available" banner + App Store + Play Store badges | Owner: @dev + @media-engineer
- [ ] Landing page CTA points to App Store smart app banner for mobile visitors | Owner: @dev
- [ ] Email to waitlist (if exists) with download link | Owner: @pm
- [ ] Social posts scheduled (X/Twitter, LinkedIn) with screenshots + deep link | Owner: @media-head
- [ ] Launch post on founder channels | Owner: CEO
- [ ] Press outreach: 5–10 target journalists (Bloomberg crypto desk, TechCrunch fintech, CoinDesk, Decrypt) — pitch embargoed 24h before launch | Owner: @media-head

### Launch week (T=0 to T+7)
- [ ] Daily social post emphasizing one feature (7 days × 1 screenshot caption = perfect rotation) | Owner: @media-head
- [ ] Waitlist upgrade nudges (convert waitlist → app users) | Owner: @pm
- [ ] Apple Search Ads campaign live with $500/day budget on long-tail keywords | Owner: @media-buyer
- [ ] Review velocity monitoring (target 50 reviews Week 1) | Owner: @pm

### Launch month (T+7 to T+30)
- [ ] PR follow-through — pitch for "one month later" story if traction strong | Owner: @media-head
- [ ] First newsletter to installed users with tips + Academy highlights | Owner: @pm + @copy-chief
- [ ] A/B test Screenshot 1 variant (hero vs. alternative) via Apple Custom Product Pages | Owner: @media-engineer
- [ ] Pitch for Apple editorial (App of the Day, Today tab) via developer relations contact (if any) | Owner: CEO + @pm

---

## 8. Team ownership matrix

| Area | Owner | Backup | Decision escalation |
|---|---|---|---|
| **Metadata fields** (all text) | @pm (Morgan) | @analyst (Atlas) | CEO for tagline/voice |
| **Visual assets** (icons, screenshots) | @ux-design-expert (Uma) | @media-engineer | CEO for brand integrity |
| **Screenshot captions** | @analyst (Atlas) → @copy-chief | @pm | CEO for voice deviation |
| **Legal/compliance** | Legal counsel | @pm | CEO |
| **Privacy Policy + ToS** | Legal counsel | @pm | CEO |
| **IAP configuration** | @devops (Gage) | @dev (Dex) | @pm for pricing changes |
| **App Store Connect submission** | @devops (Gage) | — | @pm |
| **Google Play Console submission** | @devops (Gage) | — | @pm |
| **Apple Search Ads** | @media-buyer | @media-head | @pm for budget >$2K |
| **Press & PR** | @media-head | @pm | CEO |
| **Launch-day ops** | @pm (Morgan) | @dev + @devops | CEO escalation only on crisis |
| **Review response (App Store)** | @pm | @copy-chief | CEO for 1-star responses |
| **ASO measurement/tracking** | @data-engineer (Dara) | @analyst (Atlas) | @pm |
| **Apple review liaison** | @devops | @pm | CEO if rejection escalates |

---

## 9. Pre-submission dry run (T−7 days)

One week before App Store submission, run this checklist end-to-end:

- [ ] Download TestFlight build on 3 physical devices (iPhone, iPad, older iPhone) | Owner: @qa
- [ ] Complete full user journey: install → onboard → connect funding → create DCA plan → watch Academy lesson L1 → check AI Expert response → upgrade to Pro → cancel subscription | Owner: @qa
- [ ] Run @qa's 7-point quality gate (per `.claude/rules/story-lifecycle.md`) | Owner: @qa (Quinn)
- [ ] Run CodeRabbit self-healing final pass (CRITICAL + HIGH severity) | Owner: @dev
- [ ] Verify all screenshot captions match current app UI (no version drift) | Owner: @ux-design-expert + @qa
- [ ] Verify in-app disclosures appear at correct points | Owner: @qa + legal counsel
- [ ] Verify Privacy Policy URL is live and matches declared categories | Owner: @pm
- [ ] Verify Terms of Service URL is live | Owner: @pm
- [ ] Run Apple pre-flight static analysis via Xcode | Owner: @dev
- [ ] Test subscription purchase in App Store Sandbox — both Pro and Club | Owner: @qa
- [ ] Test deep links from external sources (email, SMS, browser) | Owner: @qa

---

## 10. Submission day protocol

### T-0 morning (launch day)
- [ ] Final smoke test on production build | Owner: @qa
- [ ] Submit to App Store (binary + metadata freeze) | Owner: @devops
- [ ] Submit to Google Play (AAB + metadata freeze) | Owner: @devops
- [ ] Monitor App Store Connect for "Waiting for Review" status | Owner: @devops

### During Apple review (typical 24–48 hours)
- [ ] Keep review contact phone on | Owner: @pm
- [ ] Respond to reviewer notes within 2 hours if requested | Owner: @pm + @devops
- [ ] If rejected: diagnose reason within 4 hours, fix, resubmit same day if possible | Owner: @pm + @dev + @devops

### Post-approval (go-live)
- [ ] Monitor App Store Connect analytics hourly for first 24h | Owner: @pm + @data-engineer
- [ ] Monitor Sentry for crash spikes | Owner: @devops
- [ ] Monitor support inbox | Owner: @pm
- [ ] Execute marketing rollout per §7 | Owner: @media-head
- [ ] Celebrate (briefly — the work continues) | Owner: everyone

---

## 11. Common rejection reasons — pre-flight mitigations

Based on historical Apple rejection patterns for financial apps:

| Reason | Mitigation |
|---|---|
| **5.1.1(v) Apps that are obvious copies or minimal changes** | Original design, V3.01 logo, distinct positioning — low risk |
| **3.1.2(b) Auto-renewable subscriptions without required disclosures** | Ensure in-app: price, term, cancellation instructions, link to EULA, link to Privacy | Owner: @pm + @dev |
| **5.6.3 Financial services clarity** | Clear disclosures before first funding action; no misleading APY claims | Owner: legal counsel |
| **4.7 HTML5 / web views for core experience** | Core flow (DCA creation, Academy reader) must be NATIVE, not webview | Owner: @dev |
| **2.1 App Completeness — login credentials not working** | Demo account fully seeded and tested 48h before submit | Owner: @dev + @qa |
| **2.3.10 Misleading keywords / description** | Don't claim features we don't have; use precise numbers | Owner: @pm + legal counsel |
| **5.2.2 Third-party trademarks (Bybit)** | Written permission from Bybit to reference them by name in listing | Owner: @pm |

---

## 12. Launch-week escalation paths

**Crisis category A — Technical failure (crashes, data loss):**
- @dev + @devops + @qa triage within 1 hour
- CEO notified if >5% user impact
- Feature flag rollback / emergency hotfix

**Crisis category B — Regulatory / legal concern raised:**
- legal counsel + CEO within 2 hours
- @pm prepares public response within 4 hours
- Consider temporary subscription pause if severe

**Crisis category C — Apple editorial or policy complaint:**
- @devops liaison + @pm within 4 hours
- Do NOT resubmit without consultation
- CEO approves all Apple-facing responses

**Crisis category D — Negative press or social:**
- @media-head + @pm within 2 hours
- CEO-only statement if required
- `.claude/rules/jarvis-orchestration-playbook.md` §B (Bug Fix) for technical component

---

## 13. Post-launch retrospective (T+30 days)

Schedule retro on calendar for 30 days after public launch.

**Participants:** @pm (facilitator), @analyst, @ux-design-expert, @dev, @devops, @media-head, CEO
**Agenda:**
1. ASO KPI review vs. targets (`aso-strategy.md §6`)
2. Rejection / review notes from Apple — patterns to address for v1.1
3. User feedback themes (support tickets + reviews)
4. Screenshot CVR data — A/B test hypotheses for v1.1
5. Decisions for Q2: add ES-ES variant? iPad screenshots? App Preview Video?

---

*Checklist by @analyst (Atlas). Operational ownership by @pm (Morgan). Submission execution by @devops (Gage). Blocking items must be resolved before `*submit-app-store` can be called.*
