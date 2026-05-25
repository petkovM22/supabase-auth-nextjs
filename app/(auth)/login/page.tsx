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
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-1)',
      padding: 'var(--space-4)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo mark */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{
            width: 40, height: 40,
            background: 'var(--foreground)',
            color: 'var(--background)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
              <rect x="2"  y="2"  width="6" height="6" rx="1.5" fill="currentColor" />
              <rect x="12" y="2"  width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5" />
              <rect x="2"  y="12" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5" />
              <rect x="12" y="12" width="6" height="6" rx="1.5" fill="currentColor" />
            </svg>
          </div>
        </div>

        <form action={handleSubmit} className="ds-card">
          {/* Card header */}
          <div className="ds-card__header">
            <div className="ds-card__title">Sign in</div>
            <div className="ds-card__desc">Welcome back. Enter your details to continue.</div>
          </div>

          {/* Card body */}
          <div className="ds-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            {error && (
              <div className="ds-alert ds-alert--destructive" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="ds-field">
              <label className="ds-label" htmlFor="login-email">Email</label>
              <div className="ds-input-group">
                <span className="ds-input-group__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/>
                  </svg>
                </span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="ds-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="ds-field">
              <label className="ds-label" htmlFor="login-password">
                Password
                <a href="#" style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', textDecoration: 'underline', fontWeight: 400 }}>
                  Forgot password?
                </a>
              </label>
              <div className="ds-input-group">
                <span className="ds-input-group__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="ds-input"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="ds-btn ds-btn--primary ds-btn--md"
              style={{ width: '100%' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="ds-divider">OR</div>

            <a href="/signup" className="ds-btn ds-btn--outline ds-btn--md" style={{ width: '100%', justifyContent: 'center' }}>
              Create a new account
            </a>
          </div>

          {/* Card footer */}
          <div className="ds-card__footer">
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
              By signing in you agree to our{' '}
              <a href="#" style={{ textDecoration: 'underline' }}>Terms</a>
              {' '}and{' '}
              <a href="#" style={{ textDecoration: 'underline' }}>Privacy Policy</a>.
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
