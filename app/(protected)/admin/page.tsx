import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/actions/auth'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--surface-1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {/* Header card */}
        <div className="ds-card">
          <div className="ds-card__header" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-3)', paddingBottom: 'var(--space-6)' }}>
            <div className="ds-avatar ds-avatar--lg" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ds-card__title" style={{ fontSize: 'var(--text-base)' }}>Admin Panel</div>
              <div className="ds-card__desc" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
            <span className="ds-badge ds-badge--default">admin</span>
          </div>
        </div>

        {/* Admin access notice */}
        <div className="ds-alert ds-alert--success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Admin access granted — you have elevated privileges.</span>
        </div>

        {/* Account card */}
        <div className="ds-card">
          <div className="ds-card__header">
            <div className="ds-card__title" style={{ fontSize: 'var(--text-base)' }}>Account</div>
            <div className="ds-card__desc">Your current session details.</div>
          </div>
          <div className="ds-card__body">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: 'Email', value: user?.email },
                { label: 'User ID', value: user?.id },
                { label: 'Role', value: 'admin' },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  style={{
                    padding: 'var(--space-3) 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    gap: 'var(--space-4)',
                  }}
                >
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{row.label}</span>
                  <span
                    className="ds-muted"
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontFamily: row.label === 'User ID' ? 'var(--font-mono)' : undefined,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: 260,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="ds-card__footer" style={{ justifyContent: 'flex-end' }}>
            <form action={signOut}>
              <button type="submit" className="ds-btn ds-btn--outline ds-btn--sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                Log out
              </button>
            </form>
          </div>
        </div>

      </div>
    </main>
  )
}
