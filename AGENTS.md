# AGENTS.md

## Project

jeepo (جیپو) — offroad parts e-commerce platform. pnpm monorepo with Turborepo.

## Architecture

- `apps/api` — NestJS 11 + Prisma 7 + PostgreSQL 16. `pnpm --filter @offroad/api`
- `apps/web` — Next.js 15 customer storefront (port 3000)
- `apps/admin` — Next.js 15 admin dashboard (port 3001)
- `packages/shared` — shared TypeScript types/utils (must build before apps consume it)
- `packages/ui` — shared UI components (WIP)

## Commands

```bash
pnpm dev              # all apps via turbo
pnpm build            # all apps (resolves db:generate first)
pnpm lint             # biome check .
pnpm format           # biome check --write .
pnpm check            # lint + build together
```

Database (API only):
```bash
pnpm db:generate      # prisma generate
pnpm db:push          # push schema to DB
pnpm db:migrate       # create migration
pnpm db:deploy        # apply migrations in prod
pnpm db:seed          # seed data
pnpm db:studio        # prisma studio GUI
```

## Setup

1. `docker compose up -d` — starts PostgreSQL 16 on port 5432 (user: offroad / pass: offroad / db: offroad_shop)
2. Copy `apps/api/.env.example` → `apps/api/.env` and fill values
3. `pnpm install`
4. `pnpm db:generate && pnpm db:push`
5. `pnpm dev`

## Linting & Formatting

Biome is the sole linter/formatter. No ESLint/Prettier.

Key settings from `biome.json`:
- Indent: 2 spaces, line width 100
- Single quotes, semicolons always, trailing commas all
- `noExplicitAny` is OFF (intentional)
- `noNonNullAssertion` is OFF (intentional)
- `useImportType` is OFF for `apps/api/**` (NestJS decorators need side-effect imports)

Pre-commit hook runs `biome check --write --staged` then `pnpm build`.

## Conventions

- Package namespaced as `@offroad/*`
- Workspace deps use `workspace:*` protocol
- Node >=22, pnpm 11.6.0
- Prisma generated code at `apps/api/src/prisma/generated/` is gitignored — always run `db:generate` after cloning
- API uses `@nestjs/swagger` for docs
- Web uses Radix UI + Tailwind CSS 4 + Zod + React Hook Form + Zustand
- Shared package must be built (`tsc`) before apps can import it
