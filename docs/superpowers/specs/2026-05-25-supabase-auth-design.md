# Supabase Auth System — Design Spec
**Date:** 2026-05-25
**Status:** Approved

---

## Overview

A server-side authentication system for a Next.js App Router web app using Supabase Auth. Supports email + password sign-in, a simple admin/user role split, and middleware-based route protection.

---

## Stack

| Layer | Technology |
|---|---|
| Auth provider | Supabase Auth |
| SSR client | `@supabase/ssr` (cookie-based sessions) |
| Framework | Next.js App Router |
| Role storage | Postgres `profiles` table |
| Route protection | Next.js Middleware |

---

## Architecture

Sessions are managed via secure cookies using `@supabase/ssr`. Every request passes through Next.js Middleware, which verifies the session and checks the user's role before allowing access. Roles are stored in a `profiles` table linked to `auth.users`, auto-populated via a Postgres trigger on signup.

### Route Access Matrix

| Path | Access |
|---|---|
| `/login`, `/signup` | Public only (redirect if already authenticated) |
| `/dashboard` | Authenticated users (`user` or `admin`) |
| `/admin/*` | `admin` role only |
| Everything else | Authenticated users |

---

## File Structure

```
app/
├── (auth)/
│   ├── login/page.tsx          # Login form (email + password)
│   └── signup/page.tsx         # Sign up form
├── (protected)/
│   ├── dashboard/page.tsx      # Default authenticated landing page
│   └── admin/
│       └── page.tsx            # Admin-only page
└── layout.tsx

middleware.ts                    # Route protection + role enforcement

lib/
└── supabase/
    ├── client.ts               # Browser-side Supabase client
    ├── server.ts               # Server Component / Server Action client
    └── middleware.ts           # Middleware-specific Supabase client

db/
└── migrations/
    └── 001_profiles.sql        # profiles table, RLS policies, signup trigger
```

---

## Data Flow

### Sign Up
1. User submits email + password at `/signup`
2. Server Action calls `supabase.auth.signUp()`
3. Postgres trigger auto-creates `profiles` row with `role = 'user'`
4. Session cookie set → redirect to `/dashboard`

### Log In
1. User submits credentials at `/login`
2. Server Action calls `supabase.auth.signInWithPassword()`
3. Session cookie written → redirect to `/dashboard`

### Every Request (Middleware)
```
Request arrives
  → read session cookie
  → no session → redirect to /login
  → session valid → query profiles for role
  → route is /admin/* and role ≠ 'admin' → redirect to /dashboard
  → otherwise → allow through
```

### Log Out
1. Server Action calls `supabase.auth.signOut()`
2. Cookie cleared → redirect to `/login`

### Role Promotion
- Done via Supabase Dashboard or service-role API only
- Users cannot self-escalate (enforced by RLS)

---

## Database

### `profiles` table
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);
```

### RLS Policies
- Users can read their own row
- Users cannot update the `role` column
- Only service-role key or Postgres triggers can set `role`

### Signup Trigger
```sql
create function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

---

## Error Handling

### Auth forms
| Scenario | User-facing message |
|---|---|
| Invalid credentials | "Invalid email or password" |
| Email already exists | "An account with this email already exists" |
| Network/Supabase error | "Something went wrong, please try again" |

### Middleware
- Session expired → clear cookie, redirect to `/login`
- `profiles` query failure → deny access (fail-safe), redirect to `/login`

### Server Actions
- All calls wrapped in try/catch
- Return typed response objects: `{ error: string }` or `{ success: true }`
- No unhandled exceptions reach the UI

---

## Testing

### Unit
- Supabase client factory functions
- Role-check utility functions

### Integration
- Sign up → `profiles` row created with `role = 'user'`
- Login → session cookie set
- Middleware → `/admin/*` blocks `user`, allows `admin`

### E2E (Playwright)
- Full sign up → login → protected route → logout flow
- Admin route blocked for regular user
- Unauthenticated redirect to `/login`

---

## Out of Scope
- OAuth / social login
- Magic link / passwordless
- Email verification
- Password reset
- Profile editing
- Multi-tenancy
