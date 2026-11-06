'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { applyTheme, getTheme, type ThemeId } from '@/lib/arcade'

const ThemeContext = createContext<{ theme: ThemeId; setTheme: (t: ThemeId) => void }>({
  theme: 'daylight',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('daylight')

  useEffect(() => {
    // Layout's inline script already set data-theme before paint, but
    // re-assert it here: if that script ever failed or was bypassed, a
    // first visit would otherwise sit on the wrong theme while the
    // switcher claimed Daylight.
    const saved = getTheme()
    setThemeState(saved)
    applyTheme(saved)
  }, [])

  const setTheme = (t: ThemeId) => {
    setThemeState(t)
    applyTheme(t)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
