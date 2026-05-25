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
