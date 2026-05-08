import * as React from 'react'

const storageKey = 'darkMode'
const darkClassName = 'dark-mode'
const lightClassName = 'light-mode'

function applyDarkModeClass(isDarkMode: boolean) {
  if (typeof document === 'undefined') {
    return
  }

  document.body.classList.add(isDarkMode ? darkClassName : lightClassName)
  document.body.classList.remove(isDarkMode ? lightClassName : darkClassName)
}

function getStoredDarkMode(): boolean | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    const value = window.localStorage.getItem(storageKey)
    if (value == null) {
      return undefined
    }

    const parsedValue = JSON.parse(value)
    return typeof parsedValue === 'boolean' ? parsedValue : undefined
  } catch {
    return undefined
  }
}

function getPreferredDarkMode() {
  if (typeof window === 'undefined') {
    return false
  }

  const storedValue = getStoredDarkMode()
  if (typeof storedValue === 'boolean') {
    return storedValue
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    const nextValue = getPreferredDarkMode()
    setIsDarkMode(nextValue)
    applyDarkModeClass(nextValue)
  }, [])

  const toggleDarkMode = React.useCallback(() => {
    setIsDarkMode((currentValue) => {
      const nextValue = !currentValue

      applyDarkModeClass(nextValue)

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(nextValue))
      } catch {}

      return nextValue
    })
  }, [])

  return {
    isDarkMode,
    toggleDarkMode
  }
}
