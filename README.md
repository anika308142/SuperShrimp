# Agentcy Operations Console

Desktop-first operations console for supervising live client work, employee capacity, and agent activity.

This UI follows `AGENTCY_WEB_UI_DEVELOPER_BRIEF.md`. It is **not** a CRM, chatbot, or vanity analytics home.

## Stack

React + TypeScript + Vite, Tailwind CSS, Radix/shadcn-style primitives, TanStack Query, TanStack-style tables, React Hook Form-ready Zod client, dnd-kit, Lucide, date-fns.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Data mode

Default is a **labelled demo workspace** (`VITE_DATA_MODE=demo`). Fixture data is isolated and never presented as production.

To point at FastAPI:

```
VITE_DATA_MODE=api
VITE_API_BASE_URL=/api/v1
```

Vite proxies `/api` to `http://localhost:8000` (override with `VITE_API_PROXY`).

## Mock API (for testing)

The dashboard contract is also served as a labelled HTTP mock:

```bash
npm run mock-api
```

- Docs: http://localhost:8000/docs
- Fixture IDs: http://localhost:8000/api/v1/admin/fixtures
- Smoke test: `npm run test:api`
- UI against the mock: set `VITE_DATA_MODE=api` and run `npm run dev:api`

Reset the in-memory workspace with `POST /api/v1/admin/reset`.

## Product rules preserved in the UI

- A generated reply is not a sent reply.
- Agent activity is inspectable without secrets.
- Health/SLA/priority always include a reason plus icon/label.
- The backend (or demo adapter mimicking it) is authoritative.
- Approval is a first-class workflow state.
- Related records are navigable via the inspect sheet and shareable `?inspect=type:id` URLs.
