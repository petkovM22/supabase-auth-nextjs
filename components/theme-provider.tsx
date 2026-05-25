'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')

  // On mount, read saved preference from localStorage
  useEffect(() => {
    const saved = (localStorage.getItem('theme') as ThemeMode | null) ?? 'system'
    setModeState(saved)
    document.documentElement.setAttribute('data-theme', resolveTheme(saved))
  }, [])

  // Watch the system preference so 'system' mode reacts to OS changes
  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  function setMode(next: ThemeMode) {
    setModeState(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', resolveTheme(next))
  }

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
