# Vaolt

**Shared home finances, perfectly clear.** A premium, production-ready PWA for roommates to track shared household expenses, budgets, and settlements — designed around a single **House Manager** who records expenses while everyone else stays in sync.

Built with Next.js 16, TypeScript, Tailwind CSS v4, and Firebase (Auth · Firestore · Storage).

---

## Highlights

- **Dashboard** — monthly budget ring, your balance, budget snapshot, and recent activity at a glance.
- **Budget tracking** — spending measured against a per-category monthly plan (rent, maintenance, water, electricity, WiFi, groceries + a catch-all).
- **Expense management** — fast add/edit flow with categories, custom or equal splits, receipts, and notes. Full search, filters, and date grouping.
- **Smart settlements** — automatically computes who owes whom and **minimizes the number of transfers** needed to settle up.
- **Member balances** — transparent per-person paid/share/net breakdown.
- **Monthly reports** — category donut, contributions, budget performance, and one-tap CSV export.
- **Analytics** — 12-month spending trends, month-over-month deltas, and category distribution.
- **Recurring expenses** — set rent/WiFi once; they post automatically each month.
- **Receipt uploads** — image/PDF attachments stored in Firebase Storage.
- **Roles** — House Manager records everything; members get a clean read-first experience and can confirm their own payments.
- **PWA** — installable, offline-capable app shell + Firestore offline persistence.
- **Dark mode** — system-aware, no flash of incorrect theme.
- **Mobile-first** — bottom navigation, bottom sheets, and a floating add button; scales up to a desktop sidebar layout.

---

## Tech stack

| Area        | Choice                                             |
| ----------- | -------------------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack)                 |
| Language    | TypeScript (strict)                                |
| Styling     | Tailwind CSS v4 with a CSS-variable design system  |
| Auth        | Firebase Authentication (Google + Email/Password)  |
| Database    | Cloud Firestore (with offline persistence)         |
| Files       | Firebase Storage                                   |
| Motion      | Framer Motion                                      |
| Icons       | lucide-react                                       |
| Charts      | Bespoke, dependency-free SVG (donut / bar / line)  |

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project**.
2. **Build → Authentication → Get started** and enable the **Email/Password** and **Google** sign-in providers.
3. **Build → Firestore Database → Create database** (production mode).
4. **Build → Storage → Get started**.
5. **Project settings → General → Your apps → Web app** and copy the SDK config values.

### 3. Add your credentials

Copy the example env file and fill in the values from the console:

```bash
cp .env.local.example .env.local
```

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

> Until these are set, the app shows a friendly "Connect Firebase" screen instead of crashing.

### 4. Deploy security rules

Using the [Firebase CLI](https://firebase.google.com/docs/cli):

```bash
npm i -g firebase-tools
firebase login
firebase use --add            # select your project
firebase deploy --only firestore:rules,storage
```

The included `firestore.rules` and `storage.rules` enforce the role model (see [Security](#security)). No composite indexes are required.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, and either **create a household** (you become the House Manager) or **join** one with an invite code.

---

## Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the dev server                         |
| `npm run build`     | Production build                             |
| `npm run start`     | Serve the production build                   |
| `npm run typecheck` | Type-check without emitting                  |
| `npm run icons`     | Regenerate PWA icons from the brand mark     |

---

## Project structure

```
src/
├─ app/
│  ├─ (app)/                 # Authenticated, chrome-wrapped routes
│  │  ├─ dashboard/  expenses/  budgets/  balances/
│  │  ├─ reports/    analytics/ recurring/ settings/
│  │  └─ layout.tsx          # Auth gate + data providers + shell
│  ├─ login/  onboarding/  offline/
│  ├─ layout.tsx  page.tsx  manifest.ts  globals.css
│  └─ providers.tsx
├─ components/
│  ├─ ui/                    # Reusable primitives (Button, Card, Sheet, charts…)
│  ├─ app/                   # Feature components (ExpenseForm, Sidebar, …)
│  └─ providers/             # Theme, Toast, Auth, HouseholdData, ExpenseForm
├─ hooks/                    # useMediaQuery, useOnlineStatus
└─ lib/
   ├─ firebase/              # SDK init + auth helpers
   ├─ db/                    # Firestore services (typed, converter-based)
   ├─ finance.ts             # Splitting, balances, transfer minimization
   ├─ format.ts  constants.ts  types.ts  export.ts
```

---

## Data model (Firestore)

```
users/{uid}                     → profile + householdId + role
households/{hid}                → name, managerId, memberIds[], members{}, budgets{}, inviteCode
households/{hid}/expenses/{id}   → amount, category, paidBy, split, shares{}, date, receipt…
households/{hid}/settlements/{id}→ fromUid, toUid, amount, status, method, month
households/{hid}/recurring/{id}  → template + dayOfMonth + active + lastGenerated
```

All monetary math runs in integer **paise** (`lib/finance.ts`) to avoid floating-point drift, and splits always re-sum to the exact total.

### Settlement minimization

Balances are the net of every unsettled expense and recorded payment. `minimizeTransfers()` greedily matches the largest creditor with the largest debtor, which is optimal for household-sized groups — three people always settle in at most two transfers.

---

## Security

- Users can only read/write their own `users/{uid}` document.
- Households are readable by signed-in users (so invite codes resolve on join); structural and budget changes are **manager-only**, and a non-member can only add *themselves* when joining.
- Expenses and recurring templates are **manager-write, member-read**.
- Settlements can be recorded by the manager, or by a member for a payment they are making.
- Receipts are readable by members and writable by the manager, capped at 8 MB and limited to images/PDF.

---

## PWA & offline

- `app/manifest.ts` provides the installable manifest; icons live in `public/icons`.
- `public/sw.js` caches the app shell (network-first navigations, stale-while-revalidate for static assets) and never intercepts Firebase traffic.
- Firestore's `persistentLocalCache` keeps data available offline and syncs writes on reconnect.
- An offline banner appears automatically when the connection drops.

The service worker registers only in production (`npm run build && npm run start`).

---

## Deployment (Vercel)

1. Push the repo to GitHub and import it in Vercel.
2. Add the six `NEXT_PUBLIC_FIREBASE_*` environment variables.
3. Add your Vercel domain under **Firebase → Authentication → Settings → Authorized domains**.
4. Deploy. Remember to `firebase deploy --only firestore:rules,storage` for your rules.

---

## The monthly plan

Households start with this editable budget (₹29,500/month total):

| Category    | Budget   |
| ----------- | -------- |
| Rent        | ₹21,000  |
| Maintenance | ₹2,000   |
| Electricity | ₹1,000   |
| Water       | ₹500     |
| WiFi        | ₹1,000   |
| Groceries   | ₹4,000   |
