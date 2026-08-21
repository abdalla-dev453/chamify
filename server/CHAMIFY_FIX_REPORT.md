# Chamify — deploy & frontend fix report

Reviewed by cloning `github.com/abdalla-dev453/chamify` (main, commit at review time)
directly and reading the actual source — not the README. Every bug below was
verified by reading the code and cross-checking library behavior (SQLAlchemy driver
resolution, Flask-Limiter's documented failure mode). Nothing here is a guess.

Root cause in one sentence: **the backend cannot survive a real deploy because it
hardcodes two things — the DB driver dialect and the rate-limiter's Redis URL — to
values that only exist on your laptop**, and **the frontend cannot talk to the
backend or survive a page refresh once deployed** because two build/hosting-level
settings were never configured. None of this is a logic bug in your business code —
your auth, ledger, and wallet logic all read fine. It's entirely environment wiring.

---

## Backend: why Render deploy fails

### 1. `DATABASE_URL` scheme is incompatible with the installed driver — **breaks every DB query**

`server/app/config.py` did:

```python
SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "postgresql://...")
```

`requirements.txt` installs `psycopg[binary]==3.1.18` (psycopg **3**) — it does not
install `psycopg2`. But SQLAlchemy 2.x resolves a bare `postgresql://` scheme to the
**psycopg2** dialect by default. Render's managed Postgres also hands you a
`DATABASE_URL` starting with `postgres://` or `postgresql://`, never
`postgresql+psycopg://`.

Result: the first time the app touches the database (a login query, or `flask db
upgrade` if that's your start command), it raises:

```
ModuleNotFoundError: No module named 'psycopg2'
```

This is why it can look fine in the build logs (build succeeds, `pip install`
succeeds) and then fail the moment a request or migration actually hits Postgres.

**Fix** (`server/app/config.py`): normalize the URL scheme to
`postgresql+psycopg://` regardless of what the provider hands back. See the fixed
file — `_normalize_db_url()`.

### 2. Rate limiter's storage is hardcoded to `localhost` Redis — **breaks every auth request**

`server/app/extensions.py` did:

```python
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per hour"],
    storage_uri="redis://localhost:6379/0"
)
```

Passing `storage_uri` to the constructor freezes it at **import time**, before
`app.config` even exists — so `limiter.init_app(app)` later can never override it
with the real `REDIS_URL`. On Render there is no Redis running on `localhost`, so
every request to a route decorated with `@limiter.limit(...)` — that's
`/api/v1/auth/register`, `/login`, and `/refresh`, i.e. **all of login and
registration** — tries to connect to `localhost:6379`, fails, and by
Flask-Limiter's documented default (`swallow_errors=False`) that connection error
propagates and 500s the request.

This is almost certainly why things "don't work" for real users even after a
successful deploy: nobody can log in.

**Fix**: don't pass `storage_uri` to the constructor at all — let `init_app()` pick
up `RATELIMIT_STORAGE_URI` from `app.config`, which is now set from `REDIS_URL` in
`config.py`. See the fixed `extensions.py`.

### 3. No `Procfile` / `render.yaml` — Render doesn't know how to start the app

There's no start-command file anywhere in the repo. Without one, Render has nothing
to build a default command from, and if the dashboard's manually-entered start
command isn't exactly right (or migrations were never run), the service will crash
on boot or serve a schema-less database. Added `server/render.yaml` and a
`server/Procfile`, both of which run `flask db upgrade` before starting
`gunicorn`, so schema drift can't cause a silent failure either.

### 4. The committed `venv/` — repo hygiene, slows every deploy

`server/venv/` is committed to git — **4,348 files**. `server/.gitignore` only
excludes `__pycache__/` and `*.pyc`, not `venv/`. This doesn't crash the deploy by
itself (Render still runs `pip install -r requirements.txt` fresh), but it:
- bloats every clone/checkout Render does on each deploy,
- risks a stale/OS-mismatched interpreter shadowing the real one if any tooling
  ever picks it up from `PATH`,
- and is just noise in code review — nobody should be looking at
  `venv/lib/python3.12/site-packages/...` in a diff.

**Fix**: updated `.gitignore` (root and `server/`) to exclude `venv/`, plus the
one-time command to strip it out of git's index (see "Commands to run," below).

---

## Frontend: why links/pages "don't work" once deployed

Nothing in your React Router setup, `ProtectedRoute`, or `AuthContext` is broken —
I read `router.jsx`, `Sidebar.jsx`, `ProtectedRoute.jsx`, and `AuthContext.jsx` in
full; the logic is sound. The problem is two things that only show up **after**
deployment, never in local dev, which is exactly consistent with "it worked when I
built it":

### 5. `VITE_API_BASE_URL` isn't set at build time — every API call goes nowhere

`src/lib/apiClient.js`:

```js
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
});
```

Vite bakes `VITE_*` env vars into the JS bundle **at build time**. Locally this is
masked by the Vite dev server's proxy (`vite.config.js` proxies `/api` →
`localhost:5000`), so it "just works" in dev even with no env var set. In
production there is no dev-server proxy — if `VITE_API_BASE_URL` isn't set in
Render's build environment, every request falls back to the relative path
`/api/v1`, which resolves against the **static site's own domain** (no Flask
backend there) and 404s. Every button that hits the API — login, dashboard data,
wallet actions — will appear "broken," even though the click/navigation itself
worked fine.

**Fix**: set `VITE_API_BASE_URL` as an env var on the frontend's Render service,
pointed at the deployed backend's public URL — see `frontend/render.yaml`.

### 6. No SPA rewrite rule — direct/refreshed routes 404

React Router handles routing entirely client-side after `index.html` loads. A
static host has no idea `/wallets` or `/loans` are valid — there's no file at
`dist/wallets/index.html`. Without a rewrite rule telling Render "serve
`index.html` for any path," refreshing the page on `/wallets`, or sharing/
bookmarking a direct link to it, 404s at the server before React Router ever gets
a chance to run. Clicking links **inside** the already-loaded app works fine
(that's client-side navigation), which is why this bug is easy to miss in casual
testing but shows up immediately for real users.

**Fix**: added the `routes: - type: rewrite source: /* destination: /index.html`
block in `frontend/render.yaml`.

### 7. CORS origin must match the real deployed frontend URL

`FRONTEND_ORIGIN` defaults to `http://localhost:5173`. If it isn't overridden with
the actual deployed frontend URL in the backend's Render environment, every
cross-origin request from the deployed frontend gets blocked by CORS — visible in
the browser console as a CORS error, not a 4xx/5xx in Network tab, which is why
it's easy to miss. Also upgraded `FRONTEND_ORIGIN` to accept a comma-separated list
so a Render preview URL and the production URL can both be allowed without a
redeploy each time (see `config.py`).

---

## Files changed

- `server/app/config.py` — DB URL driver fix, `RATELIMIT_STORAGE_URI`, multi-origin CORS
- `server/app/extensions.py` — removed hardcoded limiter storage URI
- `server/.gitignore`, root `.gitignore` — stop tracking `venv/`, `node_modules/`, `.env`
- `server/render.yaml`, `server/Procfile` — explicit start command, runs migrations on deploy
- `frontend/render.yaml` — build-time `VITE_API_BASE_URL`, SPA rewrite rule

## Commands to run once, locally, before pushing

```bash
# 1. Strip the committed venv out of git's index (keeps the files on disk,
#    just stops tracking them — .gitignore then keeps them out for good)
cd chamify
git rm -r --cached server/venv
git add .gitignore server/.gitignore
git commit -m "Stop tracking venv/, ignore build artifacts"

# 2. Apply the fixed files from this report, then:
git add server/app/config.py server/app/extensions.py server/render.yaml \
        server/Procfile frontend/render.yaml
git commit -m "Fix DB driver scheme, limiter storage, add Render deploy config"
git push
```

## Env vars to set in the Render dashboard (not in git)

**Backend service:**
| Key | Value |
|---|---|
| `DATABASE_URL` | auto-filled if using Render's managed Postgres (`fromDatabase` in render.yaml) |
| `REDIS_URL` | auto-filled if using Render's managed Redis |
| `SECRET_KEY`, `JWT_SECRET_KEY` | generate real random values — do not use the `dev-...-change-me` defaults in prod |
| `FRONTEND_ORIGIN` | your deployed frontend URL, e.g. `https://chamify-web.onrender.com` |
| `DARAJA_*`, `AT_API_KEY`, `IPRS_*` | your real Daraja/Africa's Talking/IPRS credentials |

**Frontend service:**
| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | your deployed backend URL + `/api/v1`, e.g. `https://chamify-api.onrender.com/api/v1` |

## Verifying after redeploy

1. Backend: `curl https://<your-api>.onrender.com/api/v1/auth/login -X POST -d '{}' -H "Content-Type: application/json"` should return a 422 (validation error), **not** a 500 — a 500 here means either the DB or Redis fix didn't take.
2. Frontend: open the deployed site, open DevTools → Network tab, log in. The request should go to your `chamify-api.onrender.com` domain, not the frontend's own domain.
3. Frontend: navigate to `/wallets` normally, then hit browser refresh on that URL directly. It should reload the app, not 404.