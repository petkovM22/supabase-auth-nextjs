import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Auth callback route — exchanges the PKCE `code` parameter from Supabase's
 * confirmation / magic-link emails for a real session cookie.
 *
 * Supabase sends the user here after they click the email confirmation link.
 * Without this handler the code is never exchanged and the user stays logged out.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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
              // Route handler — cookies can always be set here, but catch just in case.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Session established — send the user to the dashboard (or wherever they were headed).
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('[auth/callback] Code exchange failed:', error.message)
  }

  // Something went wrong — send back to login with an error hint.
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
