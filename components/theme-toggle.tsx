'use client'

import { useTheme, type ThemeMode } from './theme-provider'

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
)

const MonitorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const OPTIONS: { value: ThemeMode; icon: React.ReactNode; label: string }[] = [
  { value: 'light',  icon: <SunIcon />,     label: 'Light' },
  { value: 'system', icon: <MonitorIcon />, label: 'System' },
  { value: 'dark',   icon: <MoonIcon />,    label: 'Dark' },
]

export function ThemeToggle() {
  const { mode, setMode } = useTheme()

  return (
    <div
      role="group"
      aria-label="Theme"
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 3,
        background: 'var(--secondary)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {OPTIONS.map(({ value, icon, label }) => {
        const active = mode === value
        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            title={label}
            onClick={() => setMode(value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              height: 28,
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              transition: 'background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
              background: active ? 'var(--background)' : 'transparent',
              color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
              boxShadow: active ? 'var(--shadow-xs)' : 'none',
            }}
          >
            {icon}
            {label}
          </button>
        )
      })}
    </div>
  )
}
