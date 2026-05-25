import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRedirectPath } from '@/lib/supabase/routing'
import type { Role } from '@/types/auth'

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
    const { data: profile, error: roleError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (roleError) console.error('[middleware] role fetch failed:', roleError.message)
    role = profile?.role ?? null
  }

  const redirectPath = getRedirectPath(pathname, !!user, role as Role | null, baseUrl)

  if (redirectPath) {
    // Copy refreshed session cookies onto the redirect response, preserving
    // all cookie options (httpOnly, secure, sameSite, path, maxAge) to avoid
    // downgrading security or dropping token rotation on redirect.
    const redirectResponse = NextResponse.redirect(redirectPath)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectResponse.cookies.set(name, value, options)
    })
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Only run middleware on auth and protected routes.
    // Excludes: Next.js internals, static files, API routes, and public assets.
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/admin/:path*',
  ],
}
