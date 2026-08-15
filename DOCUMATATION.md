# ChamaLedger Enterprise — Technical Documentation

This is the deep reference. For setup instructions, start with [`README.md`](./README.md)
instead — come here once the app is running and you need to know how something works or
where to extend it.

## Table of contents

1. [Architecture](#1-architecture)
2. [Multi-tenancy model](#2-multi-tenancy-model)
3. [Authentication & RBAC](#3-authentication--rbac)
4. [Database schema](#4-database-schema)
5. [API reference](#5-api-reference)
6. [Business logic reference](#6-business-logic-reference)
7. [M-Pesa integration](#7-m-pesa-integration)
8. [Async tasks (Celery)](#8-async-tasks-celery)
9. [Frontend architecture](#9-frontend-architecture)
10. [Environment variables](#10-environment-variables)
11. [Testing](#11-testing)
12. [Deployment](#12-deployment)
13. [Roadmap / open TODOs](#13-roadmap--open-todos)

---

## 1. Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────┐
│  React (Vite)     │────▶│  Flask API  (/api/v1/*)                │
│  localhost:5173    │◀────│  localhost:5000                        │
└─────────────────┘     │  ┌──────────────────────────────────┐ │
                          │  │ Blueprints → Controllers → Models │ │
        ┌────────────┐    │  └──────────────────────────────────┘ │
        │ USSD (AT)    │──▶│  PostgreSQL (tenant-scoped tables)    │
        └────────────┘    └──────────────┬─────────────────────┘
                                             │
                          ┌──────────────────▼─────────────────────┐
                          │  Celery workers  (Redis-backed queue)     │
                          │  — M-Pesa retry sweeps                     │
                          │  — Statement PDF generation                │
                          │  — SMS/WhatsApp/email dispatch             │
                          └────────────────────────────────────────┘
```

Every request follows the same shape on the backend:

```
HTTP request
  → routes.py        parses & validates input (Marshmallow), delegates
  → controllers.py    business logic, queries via scoped_query(Model)
  → models/           SQLAlchemy, one file per entity
  → utils/responses.py  success_response() / error_response() envelope
```

**Why split routes.py from controllers.py?** A route file should be readable in ten seconds:
validate input, call one controller function, return its response. All the actual logic — and
every SQLAlchemy query — lives in `controllers.py`, so business logic is unit-testable without
ever spinning up an HTTP request or a test client.

## 2. Multi-tenancy model

ChamaLedger is multi-tenant from the ground up (not retrofitted). Every tenant-owned table
carries a `tenant_id` column via `TenantScopedModel` (`app/models/base.py`), and
`app/middleware/tenant_scope.py` is the single enforcement point:

```python
def get_current_tenant_id():
    claims = get_jwt()
    return claims.get("tenant_id")

def scoped_query(model):
    return model.query.filter_by(tenant_id=get_current_tenant_id())
```

Every blueprint controller queries through `scoped_query(Model)`, never `Model.query` directly.
This is what makes it structurally hard for Tenant A's data to leak into a request
authenticated as Tenant B — the filter isn't something each developer has to remember to add.

**Isolation tiers** (set at onboarding, see `Tenant.isolation_mode`):

| Tenant tier | Isolation | Rationale |
|---|---|---|
| Tier 1 — Informal | `shared_schema` | 5–10 member merry-go-rounds; logical isolation via `tenant_id` filter is sufficient and cheap to run |
| Tier 2 — Registered chama | `shared_schema` | Same as above, with a Ministry certificate on file |
| Tier 3 — SACCO | `dedicated_schema` | 100+ member regulated entities get a dedicated Postgres schema, provisioned at signup — stricter isolation for the entities that carry regulatory weight |

`Tenant.dedicated_schema_name` records which schema a Tier 3 tenant lives in.
**Note:** the actual schema-provisioning routine is a Phase 4 TODO in
`app/blueprints/tenants/controllers.py: onboard_tenant()` — today every tenant runs in the
shared schema regardless of tier; the column and branch point exist so this can be added without
a data-model migration later.

## 3. Authentication & RBAC

Auth is JWT-based (`Flask-JWT-Extended`). On login, the access token carries three custom
claims read by every downstream check:

```json
{ "role": "treasurer", "tenant_id": "…", "full_name": "…" }
```

**Role hierarchy** (`app/middleware/rbac.py`), lowest to highest:

```
member  →  treasurer  →  branch_leader  →  group_admin  →  system_admin
```

Two decorators cover every access-control need:

```python
@roles_required("group_admin", "system_admin")   # exact allow-list
@minimum_role("treasurer")                          # this role and everything above it
```

`system_admin` is the only role not bound to a tenant (`User.tenant_id` is nullable for this
role) — it's reserved for the Global Admin Super-Dashboard (`/api/v1/admin/*`), which is
explicitly **not** exposed to tenant admins.

**Token lifecycle:** access tokens expire in 15 minutes, refresh tokens in 30 days
(`app/config.py`). The frontend's `lib/apiClient.js` has an axios interceptor that catches a
401, calls `/auth/refresh` with the stored refresh token, and retries the original request
transparently — see [§9](#9-frontend-architecture).

## 4. Database schema

13 tenant-scoped models plus 2 global tables (`Tenant`, `SubscriptionPlan`).

| Model | Purpose | Key relationships |
|---|---|---|
| `Tenant` | A chama/church group/SACCO — the tenant boundary itself | has many `User`, `Wallet`; one `Subscription` |
| `User` | Member/treasurer/admin account | belongs to `Tenant` (nullable for `system_admin`) |
| `Wallet` | member / group_main / sub_purpose (land, welfare, project) | belongs to `User` (nullable for group wallets) |
| `SavingsSchedule` | Weekly/monthly/merry-go-round contribution plan | has many `SavingsContribution` |
| `SavingsContribution` | One recorded contribution, manual or M-Pesa | belongs to `Wallet`, optional `SavingsSchedule`, optional `MpesaTransaction` |
| `Loan` | A loan application through its full lifecycle | belongs to `Wallet`, `User` (borrower); has many `LoanGuarantor` |
| `LoanGuarantor` | One guarantor's sign-off on a loan | belongs to `Loan`, `User` (guarantor) |
| `LedgerEntry` | One triple-entry ledger line — **never deleted, only reversed** | belongs to `Wallet`; self-referential `reverses_entry_id` |
| `MpesaTransaction` | Raw Daraja C2B/B2C record, including full callback payload | optionally matched to a `Wallet` |
| `DividendRun` / `DividendAllocation` | End-of-year distribution computed from savings history | `DividendRun` has many `DividendAllocation` |
| `WelfareRequest` | Hospitalization/bereavement fast-track fund request | belongs to `User` (requester) |
| `AgmVoteTopic` / `AgmVoteBallot` | Digital AGM voting | `AgmVoteTopic` has many `AgmVoteBallot`, one per member (unique constraint) |
| `Subscription` / `SubscriptionPlan` | Billing — plan is global, subscription is per-tenant | `Subscription` belongs to `Tenant` and `SubscriptionPlan` |
| `AuditLog` | Immutable action trail, feeds both tenant compliance views and the Global Admin dashboard | belongs to `Tenant` (nullable), `User` (actor) |

All primary keys are UUID strings (`gen_uuid()` in `app/models/base.py`), not auto-increment
integers — deliberate, so IDs are never guessable or sequential across tenants.

### The ledger is the source of truth for every balance

`Wallet.balance` is a denormalized cache, but it is **only ever written by one function**:
`app/blueprints/ledger/controllers.py: post_entry()`. Savings contributions, loan
disbursements, M-Pesa reconciliation — every one of them calls `post_entry()` rather than
touching `wallet.balance` directly. That single choke point is what makes the "nothing is ever
deleted, only reversed with a credit/debit note" rule actually true in the codebase, not just
in this document. To reverse a transaction, call `reverse_entry(entry_id)` — it posts an
equal-and-opposite entry and marks the original `is_reversed=True`; it never issues a `DELETE`.

## 5. API reference

Base URL: `/api/v1`. All authenticated routes expect `Authorization: Bearer <access_token>`.
Response envelope for every endpoint:

```json
// success
{ "success": true, "message": "...", "data": { ... } }
// error
{ "success": false, "message": "...", "errors": { "field": ["..."] } }
```

### Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | none | Create a member account + their personal wallet, in one transaction |
| POST | `/auth/login` | none | Returns `access_token` + `refresh_token` |
| POST | `/auth/refresh` | refresh token | Issues a new access token |
| GET | `/auth/me` | access token | Current user's profile |

### Tenants — `/tenants`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/tenants/onboard` | none | Create a new tenant + its group main wallet. Slug is derived from the group name. |

### Wallets — `/wallets`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/wallets` | tenant member | List every wallet in the caller's tenant |
| GET | `/wallets/<id>` | tenant member | Single wallet detail |
| POST | `/wallets/sub-wallets` | `treasurer`+ | Create a purpose-locked sub-wallet (land/welfare/project/emergency) |

### Savings — `/savings`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/savings/schedules` | tenant member | List contribution schedules |
| POST | `/savings/schedules` | `treasurer`+ | Create a weekly/monthly/merry-go-round schedule |
| POST | `/savings/contributions` | `treasurer`+ | Record a manual contribution; posts to the ledger immediately |

### Loans — `/loans`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/loans` | tenant member | List loans in the tenant |
| GET | `/loans/<id>` | tenant member | Loan detail, including guarantors and `required_guarantor_count` |
| POST | `/loans/apply` | tenant member | Apply for a loan; rejected with `422` if it exceeds the savings-multiplier limit |
| POST | `/loans/<id>/guarantors` | tenant member | Invite a guarantor (borrower cannot guarantee their own loan) |
| POST | `/loans/<id>/guarantors/approve` | the invited guarantor | Sign off; loan auto-promotes to `approved` once the required count is met |
| POST | `/loans/<id>/guarantors/decline` | the invited guarantor | Declining immediately sets the loan to `rejected` |
| POST | `/loans/<id>/disburse` | `treasurer`+ | Only valid on an `approved` loan; posts the credit ledger entry |
| GET | `/loans/<id>/schedule-preview` | tenant member | Reducing-balance repayment schedule, computed on the fly |

### Ledger — `/ledger`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/ledger/wallets/<wallet_id>/statement` | tenant member | Every ledger entry for a wallet, newest first |

### M-Pesa — `/mpesa`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/mpesa/callback/<tenant_id>` | none (public webhook) | Daraja C2B callback target — matches `BillRefNumber` to a wallet and posts the ledger entry automatically |

### Governance — `/governance`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/governance/welfare-requests` | tenant member | List welfare fund requests |
| GET | `/governance/votes` | tenant member | List open AGM vote topics |

### Compliance — `/compliance`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/compliance/audit-log` | `group_admin`+ | Last 200 audit log entries for the tenant |

### Comms — `/comms`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/comms/test-alert` | `group_admin`+ | Queue an SMS/WhatsApp/email via Celery |

### USSD — `/ussd`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ussd/session` | none (Africa's Talking webhook) | Stateless `text.split('*')` menu — balance check live, loan/guarantor flows pending |

### Billing — `/billing`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/billing/plans` | none | List subscription plans |

### Admin (Global Admin Super-Dashboard) — `/admin`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/overview` | `system_admin` only | Platform-wide tenant counts |
| GET | `/admin/kyc-queue` | `system_admin` only | Tenants pending IPRS verification |

## 6. Business logic reference

### Loan appraisal — savings multiplier

`app/utils/calculators.py: max_loan_amount()`

```python
loan_limit = total_savings × LOAN_SAVINGS_MULTIPLIER   # default 3, app/config.py
```

Enforced in `loans/controllers.py: apply_for_loan()` — a request above the limit never
becomes a database row; it's rejected with `422` before any write.

### Guarantor count policy

`Loan.required_guarantor_count()` (`app/models/loan.py`):

```python
2 guarantors  if principal ≤ 50,000
3 guarantors  if principal >  50,000
```

### Repayment schedule — reducing balance

`app/utils/calculators.py: reducing_balance_schedule()` computes, per month: interest on the
*remaining* balance, a principal component, and the new balance — standard declining-balance
amortization. `flat_rate_installment()` implements the simpler flat-rate alternative
(`Loan.interest_method` selects between the two).

### Late payment penalty

`app/utils/calculators.py: late_payment_penalty()` — `expected_amount × penalty_rate`, where
`penalty_rate` is configurable per `SavingsSchedule` (defaults to 5%, `LATE_PAYMENT_PENALTY_RATE`
in `app/config.py`).

### Kenyan phone normalization

`app/utils/validators.py: normalize_kenyan_phone()` accepts `07XXXXXXXX`, `+2547XXXXXXXX`,
`2547XXXXXXXX`, or `7XXXXXXXX` and canonicalizes all of them to `2547XXXXXXXX` / `2541XXXXXXXX`
before anything touches the database — this is what the `(tenant_id, phone_number)` uniqueness
constraint on `User` actually relies on.

## 7. M-Pesa integration

All outbound Daraja HTTP calls live in **one file**: `app/services/daraja_service.py`. Nothing
else in the codebase calls Safaricom directly.

**Inbound (C2B contributions):** Daraja POSTs to `/api/v1/mpesa/callback/<tenant_id>`
(intentionally public — Daraja can't send a JWT). `handle_c2b_callback()`:

1. Reads `BillRefNumber` (matched against a `Wallet.id`), `TransAmount`, `MSISDN`, `TransID`.
2. Records an `MpesaTransaction` row with the full raw callback payload (for audit).
3. If a wallet matched, calls `post_entry()` to credit it immediately; status `unmatched`
   otherwise, picked up later by the `retry_unmatched_mpesa_transactions` Celery task.

**Outbound (B2C disbursement):** `initiate_b2c_payment()` exists in the service layer but is
**not yet wired into `loans/controllers.py: disburse_loan()`** — today, disbursement credits the
wallet directly and assumes that *is* the payout. Wiring the real B2C call (async, via a Celery
task, updating the loan/ledger on the `ResultURL` callback) is the next planned increment —
see [§13](#13-roadmap--open-todos).

**STK push** (member-initiated contributions) is implemented in the service layer
(`initiate_stk_push()`) but has no blueprint route calling it yet.

## 8. Async tasks (Celery)

`app/extensions.py` holds the single shared `celery` instance; `app/__init__.py:_init_celery()`
binds broker/backend config onto it and wraps every task in a Flask app context, so
`current_app.config`, `db.session`, etc. work inside a task exactly like they would in a request.

| Task | File | Trigger |
|---|---|---|
| `retry_unmatched_mpesa_transactions` | `tasks/reconciliation_tasks.py` | Scheduled sweep (not yet cron-scheduled — call manually or add a Celery Beat entry) |
| `generate_statement` | `tasks/statement_tasks.py` | Will be enqueued by a Phase 5 `compliance` endpoint (not yet wired) |
| `send_alert_task` | `tasks/alert_tasks.py` | Called from `comms/controllers.py: send_test_alert()` |

**Architectural note:** task modules import `from app.extensions import celery`, never from
`celery_worker.py`. An earlier draft of this scaffold had it backwards (tasks importing the
worker entrypoint, which imports the app factory, which imports the blueprints, which import the
tasks) — a genuine circular import. If you add a new task module, follow the existing three as
the pattern, not the inverted one.

## 9. Frontend architecture

Feature-sliced: `src/features/<domain>/{api.js, *Page.jsx}` — each domain owns its own API
calls and screens rather than a flat `pages/` + `services/` split.

**The one axios instance** (`src/lib/apiClient.js`) is what every feature imports — never a
fresh `axios.create()`. Its response interceptor is what makes token refresh invisible to the
rest of the app:

```
request → 401 → interceptor queues concurrent requests, calls /auth/refresh once,
         → replays every queued request with the new token
```

**Auth state** lives in `AuthContext` (`src/features/auth/AuthContext.jsx`), hydrated on app
load by calling `/auth/me` if an access token is present in `localStorage`.

**Design tokens** — `tailwind.config.js` defines `brand.emerald` / `brand.slate` / `brand.orange`
as the only source of color; `.glass-panel`, `.btn-primary`, `.btn-accent`, `.input-field` in
`src/index.css` are the reusable component classes. No component should hardcode a hex value or
a raw `bg-white/5 backdrop-blur-md ...` chain — extend the token/class set instead.

**Whitelabel branding** — `src/theme/ThemeContext.jsx` applies a tenant's `primary_color` /
`secondary_color` / `accent_color` (from the `Tenant` model) as CSS custom properties, for the
Tier 3 SACCO custom-domain case described in the product blueprint. Not yet consumed by any
component's actual styling — the plumbing is in place, the visual override isn't applied yet.

## 10. Environment variables

Backend (`chamaledger-enterprise-api/.env`, see `.env.example`):

| Variable | Purpose |
|---|---|
| `SECRET_KEY`, `JWT_SECRET_KEY` | Flask session / JWT signing — generate real random values, never reuse the defaults |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | Celery queue backing |
| `DARAJA_CONSUMER_KEY` / `_SECRET` / `_SHORTCODE` / `_PASSKEY` / `_ENV` / `_CALLBACK_BASE_URL` | M-Pesa Daraja credentials — `_ENV` is `sandbox` or `production` |
| `IPRS_API_URL`, `IPRS_API_KEY` | National ID verification aggregator — the service fails safe to `verified: False` if unset |
| `AT_USERNAME`, `AT_API_KEY` | Africa's Talking SMS/USSD |
| `FRONTEND_ORIGIN` | CORS allow-list — must match the deployed frontend URL |

Frontend (`chamaledger-enterprise-web/.env`, see `.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Only needed if the frontend isn't proxying `/api` through Vite (e.g. separate production domains) |

## 11. Testing

```bash
cd chamaledger-enterprise-api && pytest -v
```

`tests/conftest.py` provides an `app` fixture (in-memory SQLite, fresh schema per test) and a
`client` fixture (Flask test client). Two suites exist today:

- `tests/test_auth.py` — register → wallet auto-creation → login.
- `tests/test_loan_flow.py` — the full money-movement path end to end: a member saves 10,000, applies
  for a 20,000 loan (within the 3× limit), two guarantors approve in sequence (loan stays
  `pending_guarantors` after the first, promotes to `approved` after the second), a treasurer
  disburses it, and the final wallet balance is asserted to be exactly 30,000. It also asserts
  the `get_loan()` response's `required_guarantor_count` field.

**Pattern for new tests:** seed a `Tenant` + `User`s + a `Wallet` directly via the ORM inside the
`app` fixture's context, log in through the real `/auth/login` endpoint to get a token (don't
hand-craft JWTs), then exercise the endpoint under test through the `client` fixture. This
catches RBAC and schema-validation bugs that a unit test calling the controller function directly
would miss.

## 12. Deployment

No infrastructure-as-code is included yet; this section is a checklist, not a script.

**Backend:**
1. Provision PostgreSQL and Redis (managed instances recommended — e.g. RDS/Cloud SQL + managed Redis).
2. Set every variable in [§10](#10-environment-variables) as real secrets, not `.env` files, in your host's secret manager.
3. Run `flask db upgrade` as a release step, before the new app version receives traffic.
4. Run the API with `gunicorn wsgi:app` (already a listed dependency) behind a reverse proxy (nginx/Caddy) terminating TLS.
5. Run `celery -A celery_worker.celery_app worker` as a separate long-running process/service — it must not share a process with gunicorn.
6. Point `DARAJA_CALLBACK_BASE_URL` at the public HTTPS URL Safaricom will call back to; the M-Pesa callback route is intentionally unauthenticated, so put it behind IP allowlisting or a shared-secret path segment before going live.

**Frontend:**
1. `npm run build` produces a static `dist/` — deploy it to any static host (Vercel, Netlify, S3+CloudFront, nginx).
2. Set `VITE_API_BASE_URL` to the deployed API's public URL at build time.
3. Ensure the backend's `FRONTEND_ORIGIN` matches the deployed frontend's origin exactly, or CORS will reject every request.

## 13. Roadmap / open TODOs

Every scaffolded (not-yet-fully-built) endpoint has a `# TODO(Phase N):` comment in its
controller, tied to the phases below. Search the codebase for `TODO(Phase` to find them all.

| Phase | Focus | What's left |
|---|---|---|
| 2 | M-Pesa | Wire `initiate_b2c_payment()` into `disburse_loan()`; add an STK-push route for member-initiated contributions; cron-schedule `retry_unmatched_mpesa_transactions` |
| 4 | Multi-tenant SaaS layer | Actual dedicated-schema provisioning for Tier 3 tenants; `POST /billing/subscribe`; branding/domain update endpoints |
| 5 | Governance & compliance | `POST` endpoints for welfare requests and AGM ballots; statement PDF generation wired to the existing Celery task; SASRA/trial-balance report endpoints |
| 6 | Inclusion layer | WhatsApp/email channels in `alert_tasks.py`; loan-request and guarantor-approval flows in the USSD state machine |
| 8 | Beta launch / admin | Tenant suspend/activate endpoints; platform volume & commission metrics on the admin overview |

If you pick up any of these, follow the pattern already established by `auth`, `wallets`,
`savings`, and `loans` — routes.py thin, controllers.py does the work, `scoped_query()` for every
tenant-owned read, `post_entry()` for every balance change.