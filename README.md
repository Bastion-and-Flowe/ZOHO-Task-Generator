# Zoho Task Generator

Zoho Task Generator is a Next.js 15 App Router application for capturing task rows during meetings and exporting them as Zoho Projects-compatible CSV files. It includes credentials-based authentication, draft saving, export history, and profile defaults that are injected into every exported row.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Prisma ORM
- PostgreSQL
- NextAuth.js credentials authentication
- Tailwind CSS

## Production Status

The project is prepared for deployment on Netlify with:

- App Router support
- route handlers and authentication endpoints
- PostgreSQL-ready Prisma configuration
- Netlify build configuration
- documented environment variables
- production validation commands

## Environment Variables

Copy `.env.example` to `.env` for local development.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string for Prisma |
| `NEXTAUTH_SECRET` | Yes | Secret used to sign and encrypt auth tokens/cookies |
| `NEXTAUTH_URL` | Yes | Canonical public app URL, for example `http://localhost:3000` locally or your Netlify production URL |
| `AUTH_TRUST_HOST` | Yes on Netlify | Set to `true` behind reverse proxies so forwarded host headers are trusted |

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Point `DATABASE_URL` at a PostgreSQL database.

4. Apply the Prisma schema:

```bash
npm run db:migrate:dev
```

5. Start the dev server:

```bash
npm run dev
```

## Validation Commands

Run the same production checks locally before deploying:

```bash
npm install
npm run lint
npm run type-check
npm run build
```

## Prisma Commands

```bash
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:migrate:dev
```

Use `npm run db:migrate` for production deployments against an already-provisioned PostgreSQL database.

## Netlify

Netlify supports modern Next.js through its OpenNext adapter and supports App Router, SSR, ISR, route handlers, middleware, and image optimization automatically. This project includes a minimal [`netlify.toml`](./netlify.toml) with the build command and Node version.

For full deployment steps, see [DEPLOYMENT.md](./DEPLOYMENT.md).
