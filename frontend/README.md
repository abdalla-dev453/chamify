# ChamaLedger Enterprise — Web

React + Vite + Tailwind frontend, feature-sliced (not one giant `src/components`
dump) so each domain — auth, wallets, loans, governance — owns its own API calls,
state, and pages.

## Layout

```
src/
├── app/
│   ├── router.jsx            # all routes, protected + public
│   └── layout/DashboardLayout.jsx
├── features/<domain>/
│   ├── api.js                # calls into lib/apiClient — one file per domain
│   ├── <Domain>Context.jsx   # only where domain-wide state is needed (e.g. auth)
│   └── <Page>.jsx
├── components/                # shared, domain-agnostic UI (Sidebar, StatCard, ProtectedRoute)
├── hooks/
├── lib/
│   ├── apiClient.js          # the ONE axios instance — JWT attach + refresh-on-401 interceptor
│   └── formatters.js         # formatKes(), formatDate()
├── theme/ThemeContext.jsx     # applies a tenant's whitelabel colors as CSS vars
└── locales/{en,sw}.json       # Section 4.5 English/Swahili toggle
```

## Design system

Tailwind tokens live in `tailwind.config.js` under `brand.emerald / brand.slate / brand.orange` —
matching your ACREAGE glassmorphism language. Reusable classes (`.glass-panel`, `.btn-primary`,
`.btn-accent`, `.input-field`) are defined once in `src/index.css` so no component hand-rolls
`bg-white/5 backdrop-blur-md border ...` inline.

## What's fully built vs scaffolded

`auth` (login, register, JWT refresh flow), `onboarding`, `dashboard`, `wallets`, `savings`,
`loans`, `governance`, `compliance`, `billing`, and the `admin` control-tower page are all wired to
real backend endpoints and render real data. `guarantors/GuarantorApprovalCard.jsx` is a
presentational stub — drop it into `LoansPage` once the Phase 3 guarantor-approval endpoints exist
on the backend (see the API's own TODOs).

## Setup

```bash
npm install
cp .env.example .env      # set VITE_API_BASE_URL if not proxying through Vite
npm run dev                # http://localhost:5173, proxies /api to localhost:5000
```

Build for production:

```bash
npm run build
npm run preview
```

## Adding a new feature page

1. `src/features/your_domain/api.js` — thin wrappers around `apiClient`.
2. `src/features/your_domain/YourPage.jsx` — fetch in `useEffect`, render with `.glass-panel` /
   `StatCard` / existing patterns for visual consistency.
3. Add the route in `src/app/router.jsx`, and a nav entry in `src/components/Sidebar.jsx` if it
   should be reachable from the main nav.
4. If the page needs a specific role, wrap it in `<ProtectedRoute allowedRoles={[...]}>` the same
   way `/admin` is wrapped.