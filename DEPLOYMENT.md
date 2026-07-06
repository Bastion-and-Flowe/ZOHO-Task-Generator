# Deployment Guide

## Overview

This project is designed to run on Netlify with a managed PostgreSQL database. SQLite is not suitable for Netlify production deployments because the filesystem is ephemeral.

## Local Development Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Set `DATABASE_URL` to a PostgreSQL database.

4. Apply the Prisma schema:

```bash
npm run db:migrate:dev
```

5. Start the application:

```bash
npm run dev
```

## Required Environment Variables

| Variable | Example | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public` | Required in local, preview, and production |
| `NEXTAUTH_SECRET` | random 32+ character secret | Generate with `openssl rand -base64 33` |
| `NEXTAUTH_URL` | `https://your-site.netlify.app` | Must match the public site URL for each environment |
| `AUTH_TRUST_HOST` | `true` | Required on Netlify because requests pass through a reverse proxy |

## Database Setup

Use a managed PostgreSQL provider such as Neon, Supabase, Railway, Render, or Amazon RDS.

Recommended workflow:

1. Provision the database.
2. Add `DATABASE_URL` to your local environment and Netlify environment settings.
3. Run migrations:

```bash
npm run db:migrate
```

For local schema iteration:

```bash
npm run db:migrate:dev
```

## Prisma Commands

```bash
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:migrate:dev
```

## GitHub Deployment Workflow

1. Commit your changes locally.
2. Push the default branch to GitHub.
3. Connect the GitHub repository in Netlify.
4. Configure the environment variables in Netlify.
5. Trigger the first deploy.

## Netlify Setup

### Recommended Settings

- Framework preset: `Next.js`
- Build command: `npm run build`
- Publish directory: leave empty and let Netlify manage Next.js output automatically
- Node version: `24.14.0`
- Package manager: `npm`
- Required plugins: none manually pinned; Netlify uses its OpenNext adapter automatically

### netlify.toml

The repository includes [`netlify.toml`](./netlify.toml):

```toml
[build]
  command = "npm run build"

[build.environment]
  NODE_VERSION = "24.14.0"
  NETLIFY_NEXT_SKEW_PROTECTION = "true"
```

### Netlify Environment Variables

Add these in the Netlify dashboard:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AUTH_TRUST_HOST=true`

Optional:

- `NETLIFY_NEXT_SKEW_PROTECTION=true`

## Authentication Notes

- Registration, login, logout, and protected route redirects are implemented with NextAuth credentials sessions.
- Passwords are hashed with `bcryptjs`.
- Session cookies are secured by NextAuth in production when `NEXTAUTH_URL` uses `https`.
- Mutating application routes use same-origin checks for additional CSRF protection.

## Troubleshooting

### Build fails because Prisma Client is outdated

Run:

```bash
npm run db:generate
```

### Type-check fails on a fresh clone

Run the committed script:

```bash
npm run type-check
```

It uses `tsconfig.typecheck.json` so it does not depend on pre-existing `.next` output.

### Netlify deploy succeeds but auth redirects are wrong

Check:

- `NEXTAUTH_URL` matches the deployed Netlify URL or custom domain exactly
- `AUTH_TRUST_HOST` is set to `true`
- the browser is reaching the production domain over HTTPS

### Database connection fails in production

Check:

- `DATABASE_URL` is valid
- your PostgreSQL host accepts inbound connections from Netlify
- SSL requirements from your database provider are included in the connection string if needed

### Migrations were not applied

Run:

```bash
npm run db:migrate
```

against the production database before or alongside the first production deploy.

## Common Deployment Issues

- Using SQLite on Netlify
- Missing `NEXTAUTH_SECRET`
- Incorrect `NEXTAUTH_URL`
- Missing `AUTH_TRUST_HOST`
- Forgetting to provision PostgreSQL before deploying
- Running builds against an environment without the required variables
