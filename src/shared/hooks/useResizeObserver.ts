import { useState, useEffect, useLayoutEffect } from 'react'
import type { RefObject } from 'react'

export function useResizeObserver(ref: RefObject<Element | null>): { width: number; height: number } {
  const [element, setElement] = useState<Element | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  // Track ref.current in state so the observer effect re-runs when a
  // conditionally-rendered element mounts after the initial render.
  useLayoutEffect(() => {
    setElement(ref.current)
  })

  useEffect(() => {
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setSize({ width, height })
      }
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [element])

  return size
}
