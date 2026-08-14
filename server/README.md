# Chamify Enterprise — API

Flask + PostgreSQL backend for the multi-tenant SACCO/chama platform
(see the product blueprint for full context). Built as blueprints, not a
monolith file — every module is models -> schemas -> controllers -> routes.

## Layout

```
app/
├── config.py           # env-driven config classes (dev/test/prod)
├── extensions.py        # single source of truth for db, jwt, ma, etc.
├── models/               # one file per entity, all tenant-scoped except Tenant/SubscriptionPlan
├── schemas/              # Marshmallow — request validation + response shaping
├── blueprints/<module>/
│   ├── routes.py        # HTTP layer only: parse -> call controller -> respond
│   └── controllers.py   # business logic, unit-testable without Flask test client
├── services/             # outbound HTTP clients: Daraja, IPRS, Africa's Talking
├── tasks/                 # Celery — anything slow or unreliable runs here, not inline
├── middleware/            # tenant_scope.py (isolation) + rbac.py (RBAC) + rate_limit.py
└── utils/                 # security (bcrypt), validators (KE phone/ID), calculators (interest/penalty)
```

## Why it's split this way

- **models vs schemas vs controllers vs routes** — a route file should be readable in 10 seconds:
  validate input, call one controller function, return its response. All the actual logic —
  and all the SQLAlchemy queries — live in controllers.py, which means you can unit-test business
  logic without ever spinning up an HTTP request.
- **`middleware/tenant_scope.py`** is the single enforcement point for the isolation model in
  Section 2.2 of the blueprint. Every tenant-owned query goes through `scoped_query(Model)` instead
  of `Model.query`, so a forgotten `.filter_by(tenant_id=...)` can't leak data across tenants.
- **`middleware/rbac.py`** enforces the role hierarchy (`system_admin > group_admin > branch_leader
  > treasurer > member`) via `@roles_required(...)` or `@minimum_role(...)` decorators, straight off
  JWT claims — no role check is ever hand-rolled inside a controller.
- **`blueprints/ledger/controllers.py: post_entry()`** is the *only* place any wallet balance is
  written. Every other module (savings, loans, mpesa, governance) calls into it rather than mutating
  `wallet.balance` directly — that's what makes the triple-entry, never-delete-only-reverse rule in
  Section 4.4 actually true in practice, not just in the docs.

## What's fully built vs scaffolded

`auth` and `wallets` are complete, working reference implementations — copy their
routes.py/controllers.py pattern for any new blueprint. `ledger` and `mpesa` are functionally wired
(ledger posting + a working C2B reconciliation callback). The remaining blueprints
(`savings`, `loans`, `governance`, `compliance`, `comms`, `ussd`, `billing`, `admin`, `tenants`) have
working skeleton routes plus `# TODO(Phase N):` markers tied directly to the workplan in Section 8 of
the blueprint — nothing was left as a bare `pass`.

## Setup

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET_KEY, Daraja/IPRS/AT keys

flask db init          # first time only
flask db migrate -m "initial schema"
flask db upgrade

flask run              # API on http://localhost:5000
```

Run the Celery worker (needed for M-Pesa reconciliation retries, statements, alerts):

```bash
celery -A celery_worker.celery_app worker -l info
```

Run tests:

```bash
pytest
```

## Adding a new blueprint module

1. `app/models/your_model.py` — inherit `TenantScopedModel` unless it's genuinely global.
2. `app/schemas/your_schema.py` — a `SQLAlchemyAutoSchema` for responses, a plain `Schema` for
   request bodies you want to validate strictly.
3. `app/blueprints/your_module/controllers.py` — business logic, using `scoped_query()` for reads.
4. `app/blueprints/your_module/routes.py` — thin HTTP layer, `@require_tenant` + `@minimum_role(...)`
   on every route that touches tenant data.
5. Register the blueprint in `app/__init__.py: _register_blueprints()`.

## Kenyan integrations quick reference

- **M-Pesa**: `app/services/daraja_service.py` (STK push, B2C) + `app/blueprints/mpesa/` (webhook +
  reconciliation). Never call Daraja from anywhere else.
- **IPRS**: `app/services/iprs_service.py` — fails safe to `verified: False` if unconfigured, never
  silently trusts an unverified ID.
- **Africa's Talking**: `app/services/africastalking_service.py`, dispatched async via
  `app/tasks/alert_tasks.py` so a slow SMS gateway never blocks a request.
- **USSD**: `app/blueprints/ussd/` — a simple `text.split('*')` state machine, same auth/business
  rules as the web app, not a parallel implementation.