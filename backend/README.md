# ReGive Backend v1.0.0 — Final Release

Node.js + Express + MongoDB API (Sprint 1–3 + Phase 5 hardening).

## Quick start

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm start
```

- API: `http://localhost:5000`
- Health: `GET /api/health`
- Ready: `GET /api/ready`

```bash
npm run demo:e2e
npm run test:regression
```

## Tài khoản demo

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@regive.local | Admin@123 |
| EMPLOYEE | employee@regive.local | Employee@123 |
| USER | user@regive.local | User@123 |
| BENEFICIARY | beneficiary@regive.local | Beneficiary@123 |

## Modules

Sprint 1: Auth · Campaign · Donation · Volunteer · Support · Notification  
Sprint 2: Product · Inventory · Marketplace · Order · Payment sandbox · Reports  
Sprint 3: AI assess + human confirm (no auto-publish)  
Phase 5: Helmet · rate-limit · ready probe · OpenAPI · regression · delivery docs

## Docs

- [`docs/DELIVERY.md`](docs/DELIVERY.md) — gói bàn giao
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — script demo mentor
- [`docs/RBAC.md`](docs/RBAC.md) — phân quyền
- [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md) — hạn chế
- [`docs/openapi.yaml`](docs/openapi.yaml) — OpenAPI 3

## Env

```text
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/regive
JWT_SECRET=<strong-secret>
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
AI_PROVIDER=gemini
AI_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
AUTH_RATE_LIMIT_MAX=50
API_RATE_LIMIT_MAX=300
```

Set `AI_PROVIDER=gemini` and provide `GEMINI_API_KEY` to call Gemini API for product classification, condition/quality assessment, and second-hand price recommendation. If Gemini fails, the backend records a `gemini-fallback` provider result using the local heuristic contract so the review workflow remains available.
