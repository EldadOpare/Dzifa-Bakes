# Dzifa Bakes

Premium bakery storefront and operations workspace for guided cake quotes, invoices, inventory, and equipment care.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, deployed as a static build
- API: Express 5, deployed as a Vercel serverless function
- DB: Supabase (PostgreSQL) + Drizzle ORM
- Validation: Zod, `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Getting started

1. `pnpm install`
2. Copy `.env.example` to `.env` and fill in your Supabase `DATABASE_URL` (Project Settings -> Database -> Connection string in the Supabase dashboard).
3. `pnpm run db:push` — push the Drizzle schema to your Supabase database (dev only).
4. Run the app locally:
   - `pnpm --filter @workspace/api run dev` — API server (default port 5000; on macOS, Control Center's AirPlay Receiver often already holds 5000 — override with `PORT=5050 pnpm --filter @workspace/api run dev` if so)
   - `pnpm --filter @workspace/web run dev` — frontend dev server (default port 5173). It proxies `/api/*` to `http://localhost:5000` by default, matching the `vercel.json` rewrite used in production. If you moved the API to another port, start it with `API_PROXY_TARGET=http://localhost:5050 pnpm --filter @workspace/web run dev`.
   - Open http://localhost:5173

## Common commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm run db:push` / `pnpm run db:push-force` — push DB schema changes to Supabase (dev only)

## Deployment (Vercel + Supabase)

The repo deploys as a single Vercel project:

- The frontend (`web`) builds to a static site (`web/dist/public`).
- The API (`api`) is an Express app, source in `api/index.ts` and `api/_src/`. Locally this is typechecked and run straight from TypeScript (`api/tsconfig.json`, esbuild-bundled dev server at `dev-server.mjs`).
- **Vercel never sees that TypeScript.** Across several rounds of debugging, whatever Vercel's own build pipeline runs against `.ts` files under `api/` kept independently compiling them with settings that matched neither `api/tsconfig.json` nor `tsconfig.base.json` — producing errors that never reproduced locally, on files anywhere in `api/` regardless of nesting or underscore-prefixing, and even on a `.ts` file relocated outside `api/` entirely. The only fix that stuck: leave nothing under `api/` for it to misinterpret. `vercel.json`'s `buildCommand` runs `pnpm run build` (typecheck against the real sources, exactly like local dev) and then `node api/vercel-postbuild.mjs`, which esbuild-bundles `api/index.ts` into plain JS at `api/_runtime/index.mjs`, writes a two-line plain-JS re-export shim to `api/index.mjs` (the file Vercel actually routes to), and deletes `api/index.ts`/`api/_src/` from that build. This only runs in Vercel's ephemeral, freshly-cloned build sandbox — it never touches files in the git repo.
- Build/output settings live in `vercel.json` at the repo root — no dashboard configuration needed beyond environment variables.

Required environment variables in the Vercel project settings:

- `DATABASE_URL` — use Supabase's **Transaction pooler** connection string (port `6543`) so serverless invocations reuse pooled connections instead of exhausting direct Postgres connections.

## Where things live

- `web/src/pages/Storefront.tsx` — guided custom cake builder, live quote, and the cake showcase
- `web/src/pages/ProductPage.tsx` — a single showcase item's detail page (`/cakes/:id`), with "order as shown" and "customize in the builder" paths
- `web/src/pages/InvoicePage.tsx` — saved quote / checkout, with order handoff to WhatsApp or email
- `web/src/pages/AdminDashboard.tsx` — bakery operations overview (staff only, linked from nowhere public — reached by URL)
- `web/src/pages/InventoryPage.tsx` — searchable stock ledger
- `web/src/pages/CalculatorPage.tsx` — ingredient-cost pricing calculator for staff
- `web/src/pages/EquipmentPage.tsx` — equipment and service tracking
- `web/src/lib/showcase-data.ts` — the cake catalog (price, description, ingredients, builder presets) shown on the storefront and product pages
- `web/src/lib/bakery-data.ts` — pricing math, currency formatting, and `studioContact` (the real WhatsApp number and inbox orders get sent to)
- `assets/logo.jpg` — the real brand logo, used in the header, footer, invoice, loader, and favicon
- `api/_src/routes/bakery.ts` — quote, inventory, equipment, and summary API
- `api/index.ts` — Vercel serverless entry point (wraps the Express app in `api/_src/app.ts`); only used locally and by Vercel's own `buildCommand` typecheck — `api/vercel-postbuild.mjs` replaces it with a bundled plain-JS version before Vercel's function builder runs
- `api/vercel-postbuild.mjs` — bundles the API into plain JS and removes the TypeScript sources, in Vercel's build sandbox only (see Deployment section)
- `dev-server.mjs` — local-only entry point that runs the same Express app with `app.listen()`; kept outside `api/` and out of TypeScript entirely so Vercel never tries to type-check it as a function
- `lib/db` — Drizzle schema and Supabase-ready Postgres client
- `lib/api-spec/openapi.yaml` — source of truth for shared API contracts

## Architecture decisions

- Cake pricing is calculated through one quote contract so customer invoice totals and bakery operations can evolve together.
- The storefront and admin views share the same app shell but preserve distinct customer/staff navigation.
- The first build uses seeded API data with client fallbacks so the product remains browsable while backend persistence is expanded.

## Product

Customers can configure cake size, layers, tiers, flavour, frosting, topper, drip, and finish options, then save an itemized quote as an invoice. Staff can review revenue rhythm, open orders, low-stock ingredients, inventory value, stock status, and equipment service needs.

## Design preferences

- Keep the interface premium, clean, border-led, and shadow-free.
- Fonts: Fraunces (display/headings), Instrument Sans (body), IBM Plex Mono (prices and data).
- Use smooth Framer Motion transitions; vary layout and animation between sections rather than repeating one pattern.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.
- `lib/db`'s Postgres client auto-enables SSL for any non-localhost `DATABASE_URL` (required by Supabase).
- `web/src/lib/bakery-data.ts`'s `studioContact` has the real WhatsApp number and inbox — orders sent from the storefront go there directly. The footer's studio address and Instagram handle are still placeholders; update `web/src/components/SiteFooter.tsx` with the real ones before launch.
