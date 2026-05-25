# Supabase Auth System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build email/password auth with admin/user RBAC for a Next.js App Router app using Supabase.

**Architecture:** Sessions managed via secure cookies with `@supabase/ssr`. Next.js Middleware reads the session and role on every request, redirecting unauthorized users before the page renders. Roles live in a Postgres `profiles` table, auto-populated by a trigger on signup.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase Auth, `@supabase/ssr`, Playwright (E2E)

---

## Parallel Execution Map

```
Phase 1 [sequential]:  Task 1 — Project Scaffold
                              ↓
Phase 2 [parallel]:    Task 2 (DB Migration) ─┬─ Task 3 (Supabase Clients + Types)
                                               ↓
Phase 3 [parallel]:    Task 4 (Server Actions) ─┬─ Task 5 (Middleware)
                                                 ↓
Phase 4 [parallel]:    Task 6 (Auth Pages) ─────┬─ Task 7 (Protected Pages)
                                                 ↓
Phase 5 [sequential]:  Task 8 — E2E Tests
```

> **Subagent note:** Dispatch Tasks 2+3 in parallel after Task 1 completes. Dispatch Tasks 4+5 in parallel after Tasks 2+3 complete. Dispatch Tasks 6+7 in parallel after Tasks 4+5 complete. Run Task 8 last.

---

## File Map

| File | Responsibility |
|---|---|
| `types/auth.ts` | Shared `Role` and `Profile` types |
| `lib/supabase/client.ts` | Browser Supabase client factory |
| `lib/supabase/server.ts` | Server Component / Server Action client factory |
| `lib/supabase/routing.ts` | Pure routing logic (unit testable) |
| `middleware.ts` | Reads session + role, redirects unauthorized requests |
| `actions/auth.ts` | Server Actions: signUp, signIn, signOut |
| `app/(auth)/login/page.tsx` | Login form UI |
| `app/(auth)/signup/page.tsx` | Sign-up form UI |
| `app/(protected)/dashboard/page.tsx` | Authenticated landing page |
| `app/(protected)/admin/page.tsx` | Admin-only page |
| `db/migrations/001_profiles.sql` | profiles table, RLS, signup trigger |
| `tests/routing.test.ts` | Unit tests for routing logic |
| `tests/e2e/auth.spec.ts` | Playwright E2E tests |

---

## Task 1: Project Scaffold
**Phase 1 — Sequential**

**Files:**
- Create: `package.json`, `tsconfig.json`, `.env.local`, `next.config.ts`, `app/layout.tsx`, `app/globals.css`

- [ ] **Step 1: Scaffold Next.js app**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected output ends with: `Success! Created...`

- [ ] **Step 2: Install Supabase packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 3: Install Playwright**

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

- [ ] **Step 4: Install Vitest for unit tests**

```bash
npm install --save-dev vitest @vitejs/plugin-react
```

- [ ] **Step 5: Add vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 6: Add test scripts to package.json**

Open `package.json` and add to the `"scripts"` section:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 7: Create .env.local**

Create `.env.local` (do NOT commit this file):

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> Get these values from: Supabase Dashboard → Project → Settings → API

- [ ] **Step 8: Ensure .gitignore excludes .env.local**

Verify `.gitignore` contains `.env.local` (create-next-app adds it automatically).

- [ ] **Step 9: Commit scaffold**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Supabase and Playwright"
```

---

## Task 2: DB Migration
**Phase 2 — Parallel with Task 3**
**Depends on:** Task 1

**Files:**
- Create: `db/migrations/001_profiles.sql`

- [ ] **Step 1: Create migrations directory**

```bash
mkdir -p db/migrations
```

- [ ] **Step 2: Write the migration file**

Create `db/migrations/001_profiles.sql`:

```sql
-- Create profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policy: users can read only their own profile row
create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- No insert/update policies for users — only the trigger and service role can write

-- Trigger function: auto-create profile row on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

-- Trigger: fires after every insert into auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 3: Run migration in Supabase**

Go to: Supabase Dashboard → SQL Editor → paste the contents of `001_profiles.sql` → Run

Expected: no errors, query returns successfully.

- [ ] **Step 4: Verify table exists**

In Supabase Dashboard → Table Editor: confirm `profiles` table appears with columns `id`, `role`, `created_at`.

- [ ] **Step 5: Commit migration**

```bash
git add db/migrations/001_profiles.sql
git commit -m "feat: add profiles table with RLS and signup trigger"
```

---

## Task 3: Supabase Client Utilities + Shared Types
**Phase 2 — Parallel with Task 2**
**Depends on:** Task 1

**Files:**
- Create: `types/auth.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/routing.ts`
- Create: `tests/routing.test.ts`

- [ ] **Step 1: Create shared types**

Create `types/auth.ts`:

```ts
export type Role = 'user' | 'admin'

export interface Profile {
  id: string
  role: Role
  created_at: string
}
```

- [ ] **Step 2: Create browser-side Supabase client**

Create `lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create server-side Supabase client**

Create `lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — middleware will handle session refresh
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4: Write failing unit tests for routing logic**

Create `tests/routing.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getRedirectPath } from '@/lib/supabase/routing'

const BASE = 'http://localhost:3000'

describe('getRedirectPath', () => {
  it('redirects authenticated user away from /login', () => {
    expect(getRedirectPath('/login', true, 'user', BASE)).toBe(`${BASE}/dashboard`)
  })

  it('redirects authenticated user away from /signup', () => {
    expect(getRedirectPath('/signup', true, 'user', BASE)).toBe(`${BASE}/dashboard`)
  })

  it('redirects unauthenticated user to /login from /dashboard', () => {
    expect(getRedirectPath('/dashboard', false, null, BASE)).toBe(`${BASE}/login`)
  })

  it('redirects unauthenticated user to /login from /admin', () => {
    expect(getRedirectPath('/admin', false, null, BASE)).toBe(`${BASE}/login`)
  })

  it('redirects user role away from /admin', () => {
    expect(getRedirectPath('/admin', true, 'user', BASE)).toBe(`${BASE}/dashboard`)
  })

  it('allows admin role through /admin', () => {
    expect(getRedirectPath('/admin', true, 'admin', BASE)).toBeNull()
  })

  it('allows authenticated user through /dashboard', () => {
    expect(getRedirectPath('/dashboard', true, 'user', BASE)).toBeNull()
  })

  it('allows unauthenticated user to /login', () => {
    expect(getRedirectPath('/login', false, null, BASE)).toBeNull()
  })

  it('allows unauthenticated user to /signup', () => {
    expect(getRedirectPath('/signup', false, null, BASE)).toBeNull()
  })
})
```

- [ ] **Step 5: Run tests — verify they fail**

```bash
npm test tests/routing.test.ts
```

Expected: FAIL — `getRedirectPath` is not defined yet.

- [ ] **Step 6: Implement routing logic**

Create `lib/supabase/routing.ts`:

```ts
export function getRedirectPath(
  pathname: string,
  isAuthenticated: boolean,
  role: string | null,
  baseUrl: string
): string | null {
  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const isAdminRoute = pathname.startsWith('/admin')

  // Authenticated users should not see auth pages
  if (isAuthRoute && isAuthenticated) return `${baseUrl}/dashboard`

  // Unauthenticated users cannot access protected routes
  if (!isAuthRoute && !isAuthenticated) return `${baseUrl}/login`

  // Non-admins cannot access /admin routes
  if (isAdminRoute && role !== 'admin') return `${baseUrl}/dashboard`

  // No redirect needed
  return null
}
```

- [ ] **Step 7: Run tests — verify they pass**

```bash
npm test tests/routing.test.ts
```

Expected: PASS — 9 tests passing.

- [ ] **Step 8: Commit**

```bash
git add types/auth.ts lib/supabase/client.ts lib/supabase/server.ts lib/supabase/routing.ts tests/routing.test.ts
git commit -m "feat: add Supabase client utilities, shared types, and routing logic"
```

---

## Task 4: Server Actions
**Phase 3 — Parallel with Task 5**
**Depends on:** Task 3

**Files:**
- Create: `actions/auth.ts`

- [ ] **Step 1: Create actions directory**

```bash
mkdir -p actions
```

- [ ] **Step 2: Write the Server Actions file**

Create `actions/auth.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(
  formData: FormData
): Promise<{ error: string } | never> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'An account with this email already exists' }
    }
    return { error: 'Something went wrong, please try again' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signIn(
  formData: FormData
): Promise<{ error: string } | never> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add actions/auth.ts
git commit -m "feat: add signUp, signIn, signOut server actions"
```

---

## Task 5: Middleware
**Phase 3 — Parallel with Task 4**
**Depends on:** Task 3

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write middleware**

Create `middleware.ts` at the project root:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRedirectPath } from '@/lib/supabase/routing'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must call getUser() to keep session alive
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const baseUrl = request.nextUrl.origin

  // Fetch role only for admin routes (avoid DB call on every request)
  let role: string | null = null
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role ?? null
  }

  const redirectPath = getRedirectPath(pathname, !!user, role, baseUrl)

  if (redirectPath) {
    return NextResponse.redirect(redirectPath)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware with session verification and role-based routing"
```

---

## Task 6: Auth Pages
**Phase 4 — Parallel with Task 7**
**Depends on:** Task 4

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`

- [ ] **Step 1: Create auth route group**

```bash
mkdir -p "app/(auth)/login" "app/(auth)/signup"
```

- [ ] **Step 2: Write Login page**

Create `app/(auth)/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { signIn } from '@/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        action={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm bg-white p-8 rounded-xl shadow"
      >
        <h1 className="text-2xl font-bold">Log in</h1>

        {error && (
          <p role="alert" className="text-red-600 text-sm">
            {error}
          </p>
        )}

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          autoComplete="current-password"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>

        <p className="text-sm text-center text-gray-600">
          No account?{' '}
          <a href="/signup" className="underline text-black">
            Sign up
          </a>
        </p>
      </form>
    </main>
  )
}
```

- [ ] **Step 3: Write Signup page**

Create `app/(auth)/signup/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { signUp } from '@/actions/auth'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        action={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-sm bg-white p-8 rounded-xl shadow"
      >
        <h1 className="text-2xl font-bold">Create account</h1>

        {error && (
          <p role="alert" className="text-red-600 text-sm">
            {error}
          </p>
        )}

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />

        <input
          name="password"
          type="password"
          placeholder="Password (min 6 characters)"
          required
          minLength={6}
          autoComplete="new-password"
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-sm text-center text-gray-600">
          Have an account?{' '}
          <a href="/login" className="underline text-black">
            Log in
          </a>
        </p>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)"
git commit -m "feat: add login and signup pages"
```

---

## Task 7: Protected Pages
**Phase 4 — Parallel with Task 6**
**Depends on:** Task 5

**Files:**
- Create: `app/(protected)/dashboard/page.tsx`
- Create: `app/(protected)/admin/page.tsx`

- [ ] **Step 1: Create protected route group**

```bash
mkdir -p "app/(protected)/dashboard" "app/(protected)/admin"
```

- [ ] **Step 2: Write Dashboard page**

Create `app/(protected)/dashboard/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/actions/auth'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Logged in as <span className="font-medium text-black">{user?.email}</span>
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full border rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Write Admin page**

Create `app/(protected)/admin/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/actions/auth'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-gray-600">
          Logged in as <span className="font-medium text-black">{user?.email}</span>
        </p>
        <p className="text-xs text-green-600 font-medium uppercase tracking-wide">
          ✓ Admin access granted
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full border rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(protected)"
git commit -m "feat: add dashboard and admin protected pages"
```

---

## Task 8: E2E Tests
**Phase 5 — Sequential**
**Depends on:** Tasks 6 + 7 (app must be running with valid Supabase credentials)

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/auth.spec.ts`

**Pre-requisite:** `.env.local` must have real `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` values. The DB migration (Task 2) must already be applied.

- [ ] **Step 1: Create Playwright config**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 2: Create e2e directory**

```bash
mkdir -p tests/e2e
```

- [ ] **Step 3: Write failing E2E tests**

Create `tests/e2e/auth.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

// Use a unique email per test run to avoid conflicts
const testEmail = `test+${Date.now()}@example.com`
const testPassword = 'password123'

test.describe('Unauthenticated redirects', () => {
  test('redirects /dashboard to /login when not logged in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirects /admin to /login when not logged in', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows login page at /login', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible()
  })

  test('shows signup page at /signup', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible()
  })
})

test.describe('Sign up flow', () => {
  test('signs up and lands on dashboard', async ({ page }) => {
    await page.goto('/signup')
    await page.getByPlaceholder('Email').fill(testEmail)
    await page.getByPlaceholder(/Password/).fill(testPassword)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.getByText(testEmail)).toBeVisible()
  })

  test('shows error for already registered email', async ({ page }) => {
    await page.goto('/signup')
    await page.getByPlaceholder('Email').fill(testEmail)
    await page.getByPlaceholder(/Password/).fill(testPassword)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.getByRole('alert')).toContainText('already exists', { timeout: 10000 })
  })
})

test.describe('Login flow', () => {
  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(testEmail)
    await page.getByPlaceholder('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toContainText('Invalid email or password', { timeout: 10000 })
  })

  test('logs in and lands on dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(testEmail)
    await page.getByPlaceholder('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('authenticated user is redirected away from /login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(testEmail)
    await page.getByPlaceholder('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    // Now visit /login again — should redirect to /dashboard
    await page.goto('/login')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Admin route protection', () => {
  test('blocks regular user from /admin', async ({ page }) => {
    // Login as regular user
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(testEmail)
    await page.getByPlaceholder('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    // Attempt to navigate to /admin
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

test.describe('Logout flow', () => {
  test('logs out and redirects to /login', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(testEmail)
    await page.getByPlaceholder('Password').fill(testPassword)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    // Logout
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })

    // Confirm session is gone
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
```

- [ ] **Step 4: Start the dev server**

```bash
npm run dev
```

Leave this running in a separate terminal.

- [ ] **Step 5: Run E2E tests**

```bash
npm run test:e2e
```

Expected: All tests pass. If any fail, check:
- `.env.local` has correct Supabase URL and anon key
- DB migration was applied (profiles table exists with trigger)
- Dev server is running on port 3000

- [ ] **Step 6: Run unit tests to confirm nothing regressed**

```bash
npm test
```

Expected: 9 tests passing (routing logic).

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/e2e/auth.spec.ts
git commit -m "test: add E2E auth flow tests with Playwright"
```

---

## Done ✓

At completion you will have:
- ✅ Email + password sign up, log in, log out
- ✅ Admin/user role split via `profiles` table
- ✅ Middleware-enforced route protection
- ✅ RLS preventing role self-escalation
- ✅ 9 unit tests (routing logic)
- ✅ 10 E2E tests covering all auth flows
