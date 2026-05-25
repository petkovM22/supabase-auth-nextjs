'use client'

import { useState } from 'react'
import { signUp } from '@/actions/auth'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setInfo(null)
    const result = await signUp(formData)
    if (result && 'error' in result) {
      setError(result.error)
      setLoading(false)
    } else if (result && 'info' in result) {
      setInfo(result.info)
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

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
          <img src="/logo.png" alt="Logo" style={{ width: 72, height: 72, objectFit: 'contain' }} />
        </div>

        <form action={handleSubmit} className="ds-card">
          {/* Card header */}
          <div className="ds-card__header">
            <div className="ds-card__title">Create account</div>
            <div className="ds-card__desc">Start for free. No credit card required.</div>
          </div>

          {/* Card body */}
          <div className="ds-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

            {/* Error alert */}
            {error && (
              <div className="ds-alert ds-alert--destructive" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Info / success banner */}
            {info && (
              <div className="ds-alert ds-alert--success" role="status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>{info}</span>
              </div>
            )}

            {/* Email */}
            <div className="ds-field">
              <label className="ds-label" htmlFor="signup-email">Email</label>
              <div className="ds-input-group">
                <span className="ds-input-group__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/>
                  </svg>
                </span>
                <input
                  id="signup-email"
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
              <label className="ds-label" htmlFor="signup-password">Password</label>
              <div className="ds-input-group">
                <span className="ds-input-group__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="ds-input"
                />
              </div>
              <span className="ds-help">Use at least 6 characters.</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="ds-btn ds-btn--primary ds-btn--md"
              style={{ width: '100%' }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </div>

          {/* Card footer */}
          <div className="ds-card__footer">
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted-foreground)' }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
