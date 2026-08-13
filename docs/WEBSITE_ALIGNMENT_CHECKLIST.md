# PoleSafe Website Alignment Checklist

Use this to audit any public-facing page, landing page, onboarding screen, school portal, or marketing copy against the actual PoleSafe platform.

## 1) Core Safety Narrative

Check that the website clearly and accurately explains:

- Child safe-word verification
  - Does it mention the secret child safe-word flow?
  - Does it avoid implying the word is shown too early?
  - Does it explain that the driver only reveals it at arrival?
- Boda Boda safety verification
  - Does it mention vest and helmet verification where relevant?
  - Does it reflect actual photo or confirmation steps used by the app?
- Anti-forgery trust screening
  - Does it mention Hamnah AI or document screening only if the product really enforces it?
  - Does it avoid overstating AI verification beyond what the code actually does?

### Red flags
- Claims of “instant approval” if the platform still requires review
- Safe-word wording that suggests early reveal
- Generic ride-hailing language that hides the child-safety model
- Safety claims that are not backed by visible workflow or backend enforcement

---

## 2) School Admin OS Capabilities

Check that the website accurately markets:

- Universal School Dashboard
- Multi-gate geo-fencing with 200m gate detection
- Gate pinning / physical gate mapping by dispatcher
- Class teacher attendance portals
- Manual and PoleSafe attendance reporting
- Staggered dismissal bell scheduling
- Mass broadcast / SMS / school announcement flows

### Red flags
- School portal copy that sounds like a generic CRM instead of a transport OS
- Missing gate-mapping, attendance, or broadcast language
- Claims about automation that are not supported by the backend flows

---

## 3) Dual Account & Upfront Bundles

Check whether the website explains:

- Kids Mobility Account vs Personal Ride Account
- Role or mode switching in plain language
- Weekly / monthly / termly upfront bundle pricing
- MTN MoMo and Airtel Money support
- The fact that bundles are paid upfront before scheduling where required

### Red flags
- Missing explanation of account modes
- Promising pay-later behavior if the platform is prepaid
- Confusing school transport with ordinary personal ride-hailing

---

## 4) Messaging & Branding Consistency

Check for alignment between the website and the actual app/backend:

- Does the homepage match the true product direction?
- Are the same terms used across website, mobile app, and backend?
- Are feature names consistent?
- Are school, parent, and driver journeys described in a way that matches the actual UI?

### Red flags
- Old branding or outdated product wording
- Features promised on the website that do not exist in the app
- Backend features that are present but invisible on the website
- Mixed language between “ride app,” “school transport OS,” and “safety platform”

---

## 5) Page-by-Page Audit Questions

### Homepage
- Does it immediately communicate that PoleSafe is a school transport safety OS for Uganda?
- Does it mention parents, schools, drivers, and dispatchers in a clear structure?
- Does it lead with trust and safety rather than generic mobility marketing?

### Parent onboarding / parent landing
- Does it explain child safety verification?
- Does it explain safe-word and arrival-time reveal behavior correctly?
- Does it explain ride booking, school transport, and account mode clearly?

### School portal / school landing
- Does it show gate control, attendance, broadcasts, and dismissal scheduling?
- Does it speak to school administrators in practical terms?
- Does it mention multi-gate management and route oversight?

### Driver / compliance landing
- Does it explain vetting, safety checks, and arrival verification clearly?
- Does it mention vest/helmet confirmation when applicable?
- Does it avoid language that undermines compliance seriousness?

### Pricing / bundles page
- Are upfront bundles explained honestly?
- Are weekly, monthly, and termly options clear?
- Are payment methods and discount logic consistent with the product?

---

## 6) Alignment Verdict Scale

Use one of these statuses for each page or claim:

- **Aligned** — matches the codebase and product behavior
- **Partially aligned** — direction is right, but wording or details are incomplete
- **Misleading** — markets a capability the platform does not actually enforce
- **Missing** — important platform capability is absent from the website

---

## 7) Copy Adjustment Rules

When rewriting copy:

- Prefer concrete, Uganda-specific language
- Prefer the actual workflows used by the product
- Avoid vague “AI-powered” claims unless the feature is visible and real
- Avoid generic taxi-app language if the product is school transport safety infrastructure
- Keep trust claims strong, but never overstate what is not yet enforced

---

## 8) Final Audit Output Format

When reporting findings, return:

1. Overall verdict
2. Page-by-page status
3. Misleading claims
4. Missing claims
5. Suggested copy fixes
6. Suggested UI fixes
7. Priority order for changes

---

## Short Audit Prompt Version

> Audit our public website, onboarding, and school portal copy against the actual PoleSafe backend and mobile product. Verify that the site accurately markets the real safety, school admin, account mode, and bundle features, without overstating anything. Check safe-word flow, vest/helmet verification, anti-forgery screening, 200m gate geo-fencing, attendance, broadcasts, dismissal bells, dual-mode accounts, and upfront MTN/Airtel bundle logic. Report any mismatches, outdated claims, missing features, and recommended copy/UI fixes.
