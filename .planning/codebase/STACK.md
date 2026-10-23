---
last_mapped_commit: e71d371f0b1a0bb7717760e1980d0ce50cf0072c
last_mapped_at: 2026-10-23
---
# Technology Stack

**Analysis Date:** 2026-10-23

## Languages

**Primary:**
- TypeScript 5.9 - application, domain services, tests, Prisma configuration, and seed in `src/`, `tests/`, and `prisma/`
- CSS - Tailwind/PostCSS styling in `src/app/globals.css`

**Secondary:**
- SQL - PostgreSQL migrations in `prisma/migrations/`
- Shell - container startup orchestration in `scripts/start.sh`

## Runtime

**Environment:**
- Node.js 24 or newer, declared in `package.json` and used by `Dockerfile` and `.github/workflows/ci.yml`

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Next.js 16.4.2 - React App Router application and server routes in `src/app/`
- React 19.3.1 / React DOM 19.3.1 - UI components in `src/components/` and `src/app/`
- Auth.js / NextAuth 5.0.0-beta.32 - credential authentication in `src/auth.ts`
- Prisma 7.10.1 - PostgreSQL schema, migrations, generated client, and data access in `prisma/` and `src/lib/prisma.ts`

**Testing:**
- Node test runner with `tsx` - tests under `tests/`, invoked by `npm test`

**Build/Dev:**
- TypeScript 5.9.0 - strict type checking through `tsconfig.json`
- ESLint 10.13.0 with `eslint.config.mjs` - linting via `npm run lint`
- Tailwind CSS 4.3.3 and `@tailwindcss/postcss` - styling build through `postcss.config.mjs`
- Next Turbopack - development server via `npm run dev`

## Key Dependencies

**Critical:**
- `@prisma/client` 7.10.1 and `@prisma/adapter-pg` 7.10.1 - typed PostgreSQL persistence in `src/lib/prisma.ts`
- `pg` 8.23.1 - PostgreSQL driver used by Prisma adapter
- `next-auth` 5.0.0-beta.32 - session and credentials flow in `src/auth.ts`
- `bcryptjs` 3.0.3 - password hashing and verification in `src/auth.ts` and `prisma/seed.ts`
- `zod` 4.6.7 - credential and domain input validation in `src/lib/auth/schema.ts` and `src/lib/finance/validation.ts`

**Infrastructure:**
- `dotenv` 18.0.8 - loads local environment configuration in `prisma.config.ts` and `prisma/seed.ts`
- `recharts` 3.10.1 - dashboard charts in `src/components/dashboard/overview-charts.tsx`
- `lucide-react` 1.59.0 - interface icons in UI components

## Configuration

**Environment:**
- Runtime configuration is supplied through environment variables; `.env.example` exists and `.env` is gitignored. Do not commit credentials.
- `DATABASE_URL` is required by `prisma.config.ts` and `src/lib/prisma.ts`; authentication and initial-account variables are consumed by `src/auth.ts` and `prisma/seed.ts`.

**Build:**
- `next.config.ts` enables standalone output.
- `tsconfig.json` enables strict TypeScript and `@/*` to `src/*` path aliases.
- `Dockerfile` performs a multi-stage npm install, Prisma generation, Next build, and production standalone image.
- `prisma.config.ts` defines schema, migration path, and seed command.

## Platform Requirements

**Development:**
- Node.js 24+, npm, and Docker Compose with PostgreSQL 17; see `README.md`.

**Production:**
- Node 24 Alpine container from `Dockerfile`, PostgreSQL 17 service/volume from `docker-compose.yml`, or a private PostgreSQL endpoint on Coolify as documented in `README.md`.

---

*Stack analysis: 2026-10-23*
