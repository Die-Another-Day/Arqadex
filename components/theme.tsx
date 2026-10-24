'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { applyTheme, getTheme, type ThemeId } from '@/lib/arcade'

const ThemeContext = createContext<{ theme: ThemeId; setTheme: (t: ThemeId) => void }>({
  theme: 'neon',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('neon')

  useEffect(() => {
    // Layout's inline script already set data-theme before paint;
    // this just syncs React state with it.
    setThemeState(getTheme())
  }, [])

  const setTheme = (t: ThemeId) => {
    setThemeState(t)
    applyTheme(t)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
