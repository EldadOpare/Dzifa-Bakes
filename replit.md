# Dzifa Bakes

Premium bakery storefront and operations workspace for guided cake quotes, invoices, inventory, and equipment care.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/dzifa-bakes/src/pages/Storefront.tsx` — guided custom cake builder and live quote
- `artifacts/dzifa-bakes/src/pages/InvoicePage.tsx` — saved quote / invoice view
- `artifacts/dzifa-bakes/src/pages/AdminDashboard.tsx` — bakery operations overview
- `artifacts/dzifa-bakes/src/pages/InventoryPage.tsx` — searchable stock ledger
- `artifacts/dzifa-bakes/src/pages/EquipmentPage.tsx` — equipment and service tracking
- `artifacts/api-server/src/routes/bakery.ts` — quote, inventory, equipment, and summary API
- `lib/api-spec/openapi.yaml` — source of truth for shared API contracts

## Architecture decisions

- Cake pricing is calculated through one quote contract so customer invoice totals and bakery operations can evolve together.
- The storefront and admin views share the same app shell but preserve distinct customer/staff navigation.
- The first build uses seeded API data with client fallbacks so the product remains browsable while backend persistence is expanded.

## Product

Customers can configure cake size, layers, tiers, flavour, frosting, topper, drip, and finish options, then save an itemized quote as an invoice. Staff can review revenue rhythm, open orders, low-stock ingredients, inventory value, stock status, and equipment service needs.

## User preferences

- Keep the interface premium, clean, whitish/greyish, border-led, shadow-free, and free of purple gradients.
- Use smooth Framer Motion transitions and avoid generic raw AI layouts.

## Gotchas

- Managed workflows provide `PORT` and `BASE_PATH`; restart them through the workflow names rather than running the frontend directly.
- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
