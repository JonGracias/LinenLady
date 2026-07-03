# LinenLady — Frontend

Next.js 16 (App Router, React 19, Tailwind v4) app for **Noemi The Linen Lady**. Serves the public storefront and the `/admin` back-office, and exposes `/api` route handlers that proxy to the C# backend ([`LinenLady.Api`](../LinenLady.Api)).

This is one half of a two-project repo — see the root [CLAUDE.md](../CLAUDE.md) for the full architecture. The backend is the system of record; this app owns UI, auth gating, and request proxying.

## Getting started

```bash
npm install
cp _env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

You'll also need the backend running locally (defaults to `http://localhost:5152`). See [`LinenLady.Api`](../LinenLady.Api).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build (`.next`) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config, `eslint.config.mjs`) |

No test runner is configured.

## Environment

Copy [`_env.example`](_env.example) to `.env.local` and fill it in. Every variable there is read somewhere in the code; `NEXT_PUBLIC_*` values are build-time and exposed to the browser. `ADMIN_ORG_ID` (server) and `NEXT_PUBLIC_ADMIN_ORG_ID` (client) must hold the same Clerk org id, and that id must also match `Clerk:AdminOrgId` on the backend.

## Structure

- `src/app/(store)/` — public storefront routes
- `src/app/admin/` — back-office UI and its `/admin/api/*` proxy routes
- `src/app/api/` — public proxy route handlers
- `src/proxy.ts` — Next.js middleware (Clerk auth; guards `/admin` and `/account`; holds a currently-disabled pre-launch gate)
- `src/lib/proxy.ts` / `src/lib/request.ts` — the server- and client-side halves of the backend proxy + Clerk token flow (**read their header comments before editing** — the token-freshness handling is deliberate)
- `src/context/*` — React context providers for storefront, inventory, and session state

## Key integrations

- **Clerk** — authentication and the admin-org check
- **Cloudflare Turnstile** — contact-form spam protection (site key here, secret on the API)
- **Cloudflare image zone** — fronts Azure Blob image delivery (`NEXT_PUBLIC_CF_IMAGE_ZONE`)

`launch-blast.mjs` is a throwaway one-shot script (Clerk + Resend) for the launch-day email; it is not part of the app runtime.

## Deployment

Deploys to **Azure Static Web Apps** on push to `master` via [.github/workflows/azure-static-web-apps-gentle-stone-034578210.yml](.github/workflows/azure-static-web-apps-gentle-stone-034578210.yml). Build-time `NEXT_PUBLIC_*` values are injected there.
