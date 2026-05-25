# Supabase Auth — Next.js App Router

Email + password authentication with admin/user RBAC, built with Next.js 14 and Supabase.

## Features

- Email + password sign up, log in, log out
- Admin / user role split via Postgres `profiles` table
- Middleware-enforced route protection (server-side, before page renders)
- Row-Level Security — users cannot escalate their own role

## Routes

| Path | Access |
|---|---|
| `/login`, `/signup` | Public (redirects if already logged in) |
| `/dashboard` | Authenticated users |
| `/admin` | Admin role only |

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your project credentials from **Supabase Dashboard → Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Apply the database migration

In **Supabase Dashboard → SQL Editor**, run the contents of:

```
db/migrations/001_profiles.sql
```

This creates the `profiles` table, RLS policies, and the signup trigger.

> **Note:** If your Supabase project has **email confirmation enabled** (the default), users must confirm their email before they can log in. To disable it for development: **Authentication → Providers → Email → disable "Confirm email"**.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

### 6. Promote a user to admin

In **Supabase Dashboard → Table Editor → profiles**, update the `role` column to `'admin'` for the desired user.

## Testing

### Unit tests

```bash
npm test
```

9 tests covering the routing logic in `lib/supabase/routing.ts`.

### E2E tests

Requires real Supabase credentials in `.env.local` and email confirmation **disabled**.

```bash
npm run test:e2e
```

## Tech Stack

- [Next.js 14](https://nextjs.org) — App Router
- [Supabase](https://supabase.com) — Auth + Postgres
- [@supabase/ssr](https://github.com/supabase/ssr) — Server-side session management
- [Tailwind CSS](https://tailwindcss.com)
- [Vitest](https://vitest.dev) — Unit tests
- [Playwright](https://playwright.dev) — E2E tests
