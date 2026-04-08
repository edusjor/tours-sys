# tours-sys Workspace Instructions

## Build And Run
- Install dependencies with `npm install`.
- Start development server with `npm run dev` (runs on port `3003`).
- Run lint checks with `npm run lint`.
- Build production bundle with `npm run build`.
- Start production server with `npm run start` (port `3003`).
- Build VPS package with `npm run package:vps`.

## Database And Prisma
- This project uses PostgreSQL + Prisma (`prisma/schema.prisma`).
- `predev`, `prebuild`, and `prestart` automatically run `db:generate` and `db:ensure`.
- `db:ensure` runs `prisma migrate deploy` and `prisma db push --skip-generate`; expect DB access to be required for dev/build/start.
- For local DB, use `docker-compose.yml` (Postgres 16 on `5432`).
- On Windows, if `prisma generate` fails with `EPERM` on Prisma engine rename, stop running Node/Next processes and retry.

## Architecture
- Public pages are in App Router under `src/app/**`.
- API endpoints are in Pages Router under `src/pages/api/**` (project intentionally uses mixed routing).
- Shared backend utilities are in `src/lib/**`:
	- `src/lib/prisma.ts` for Prisma client singleton.
	- `src/lib/adminAuth.ts` for admin session signing/validation.
	- `src/lib/onvo.ts` for payment provider integration.
- Uploaded files are handled by API routes and served through the `/uploads/*` rewrite.

## Coding Conventions
- Keep TypeScript strict and explicit, especially in API handlers (`NextApiRequest`, `NextApiResponse`).
- Use `"use client"` at the top of App Router components that use React hooks or browser APIs.
- Keep user-facing copy and API error messages in Spanish unless a task explicitly introduces multilingual support.
- Preserve existing response shapes in API routes (`{ error: string }`, `{ ok: boolean }`, data payloads) to avoid frontend regressions.
- Prefer targeted, minimal changes; do not refactor broad areas unless requested.

## Known Project Risks
- Admin tours flow is partially implemented: create exists, but full update/delete coverage is incomplete.
- Some admin edits rely on local storage behavior; verify persistence against DB-backed APIs before assuming data is saved.
- Reservation flow can overbook if capacity checks are changed carelessly; preserve server-side availability validation.

## Environment Variables
- Core: `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.
- Payments: `ONVO_SECRET_KEY`, `ONVO_PUBLIC_KEY`.
- Email/contact: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_FROM`, optional `CONTACT_TO_EMAIL`.
- Reviews widget (optional): `GOOGLE_PLACES_API_KEY`, optional `GOOGLE_PLACE_QUERY`.

## Documentation Links
- Known issues and current technical debt: `notas`.
- Product direction and future architecture ideas: `notas posible update`.
- Data model contract: `prisma/schema.prisma`.
- NPM scripts and authoritative command list: `package.json`.
