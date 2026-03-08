const PREFIX = 'lst.'

export function useLocalStorage<T>(
  key: string
): [T | null, (value: T) => void, () => void] {
  const storageKey = PREFIX + key

  const getValue = (): T | null => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  const setValue = (value: T): void => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // silently ignore write failures (e.g. private browsing quota)
    }
  }

  const clearValue = (): void => {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // silently ignore
    }
  }

  return [getValue(), setValue, clearValue]
}
