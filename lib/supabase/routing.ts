import type { Role } from '@/types/auth'

export function getRedirectPath(
  pathname: string,
  isAuthenticated: boolean,
  role: Role | null,
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
