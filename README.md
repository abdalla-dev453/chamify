# Chamify Enterprise

**A multi-tenant digital financial & community ecosystem for Kenyan chamas, church groups, and SACCOs.**

Savings, lending, welfare, governance, and compliance — reconciled automatically against
M-Pesa — for any group running its money on WhatsApp threads and paper ledgers today.

Full-stack monolith: Flask + PostgreSQL API, React + Vite + Tailwind frontend, Celery for
everything async, USSD as a first-class client for members without smartphones.

---

## Why this exists

Most Kenyan chamas and small SACCOs run on a treasurer's notebook, a WhatsApp group, and
whatever M-Pesa statement someone remembered to screenshot. That works until it doesn't —
until the treasurer changes, until a loan dispute needs a paper trail, until a group outgrows
manual reconciliation. Chamify digitizes that whole workflow without asking anyone to stop
using M-Pesa or switch to English-only tooling.

## What it does

| Capability | Detail |
|---|---|
| **Multi-tier wallets** | Individual member wallets, one group main wallet, purpose-locked sub-wallets (land, welfare, project funds) |
| **Micro-lending** | Reducing-balance or flat-rate interest, automated appraisal against a savings multiplier (loan limit = 3× savings), 2–3 member digital guarantor sign-off before disbursement |
| **M-Pesa reconciliation** | Daraja C2B contributions matched to a wallet by account reference automatically; B2C powers instant loan disbursement |
| **Governance** | RBAC hierarchy (System Admin → Group Admin → Branch Leader → Treasurer → Member), digital AGM voting, fast-track welfare fund approvals |
| **Compliance** | Immutable triple-entry ledger — nothing is ever deleted, only reversed — plus SASRA-style reports and self-service member statements |
| **Inclusion** | SMS/WhatsApp alerts via Africa's Talking, a USSD gateway for feature-phone members, English/Swahili toggle throughout |
| **Multi-tenancy** | One codebase serves informal 5-person merry-go-rounds and 100+ member regulated SACCOs, isolated by tenant |

See [`DOCUMENTATION.md`](./DOCUMENTATION.md) for the full technical reference — architecture,
API endpoints, database schema, and the business logic behind each of these.

## Project structure

```
chamaledger-enterprise/
├── chamaledger-enterprise-api/     # Flask + PostgreSQL backend
│   ├── app/
│   │   ├── models/                  # 13 SQLAlchemy models, one file each
│   │   ├── schemas/                 # Marshmallow request/response schemas
│   │   ├── blueprints/<module>/     # routes.py (HTTP) + controllers.py (logic), 12 modules
│   │   ├── services/                 # Daraja, IPRS, Africa's Talking HTTP clients
│   │   ├── tasks/                    # Celery — M-Pesa retries, statements, alerts
│   │   ├── middleware/               # tenant isolation + RBAC enforcement
│   │   └── utils/                    # security, validators, interest/penalty calculators
│   ├── tests/
│   └── README.md                    # backend-specific setup & conventions
│
└── chamaledger-enterprise-web/      # React + Vite + Tailwind frontend
    ├── src/
    │   ├── app/                      # router, layout shells
    │   ├── features/<domain>/        # one folder per domain: auth, wallets, loans, governance...
    │   ├── components/                # shared UI (Sidebar, ProtectedRoute, StatCard)
    │   ├── lib/                       # axios client with JWT refresh, formatters
    │   └── theme/                     # tenant whitelabel branding
    └── README.md                    # frontend-specific setup & conventions
```

## Tech stack

**Backend** — Flask 3, SQLAlchemy, Flask-Migrate (Alembic), Flask-JWT-Extended, Marshmallow,
PostgreSQL, Celery + Redis, bcrypt, Flask-Limiter.

**Frontend** — React 18, Vite, React Router, Tailwind CSS, Axios, Lucide icons.

**Kenyan integrations** — M-Pesa Daraja (C2B/B2C), IPRS identity verification, Africa's
Talking (SMS/USSD).

## Quick start

You'll need PostgreSQL and Redis running locally (or point `DATABASE_URL` / `REDIS_URL` at
hosted instances).

```bash
# 1. Backend
cd chamaledger-enterprise-api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # fill in DATABASE_URL, JWT_SECRET_KEY at minimum
flask db init && flask db migrate -m "initial schema" && flask db upgrade
flask run                          # → http://localhost:5000

# 2. Celery worker (separate terminal — needed for M-Pesa retries, statements, SMS)
celery -A celery_worker.celery_app worker -l info

# 3. Frontend (separate terminal)
cd chamaledger-enterprise-web
npm install
cp .env.example .env
npm run dev                        # → http://localhost:5173, proxies /api to :5000
```

Run the backend test suite:

```bash
cd chamaledger-enterprise-api && pytest -v
```

The included tests exercise the full money-movement path: a member saves, applies for a loan
against that savings, gets guaranteed by two other members, and a treasurer disburses it —
asserting the ledger balance at every step.

## Current build status

| Module | Status |
|---|---|
| Auth (register/login/refresh, JWT) | ✅ Complete |
| Wallets (multi-tier, sub-wallets) | ✅ Complete |
| Savings schedules & contributions | ✅ Complete |
| Loans (appraisal, guarantors, disbursement) | ✅ Complete |
| Ledger (triple-entry, reversal) | ✅ Complete |
| M-Pesa (C2B webhook + reconciliation) | ✅ Complete — B2C payout wiring is next |
| Tenant onboarding | ✅ Complete |
| Governance (AGM voting, welfare) | 🟡 Read endpoints live; write endpoints scaffolded |
| Compliance (audit log, statements) | 🟡 Audit log live; statement PDF generation scaffolded |
| Comms (SMS/WhatsApp/email) | 🟡 SMS dispatch live; WhatsApp/email scaffolded |
| USSD | 🟡 Balance check live; loan request/guarantor flows scaffolded |
| Billing (subscriptions, commissions) | 🟡 Plan listing live; subscribe flow scaffolded |
| Global Admin dashboard | 🟡 Overview + KYC queue live; suspend/activate scaffolded |

"Scaffolded" means a working route exists with a `# TODO(Phase N):` comment tied to the
implementation workplan — see `DOCUMENTATION.md § Roadmap` for what's left in each.

## License

Proprietary — internal build for the Chamify Enterprise product. Not licensed for
redistribution.