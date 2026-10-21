import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Cronômetro regressivo baseado em timestamps (Date.now), tolerante a
 * períodos em que a aba/janela perde o foco.
 */
export function useCountdown() {
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const endRef = useRef<number | null>(null)
  const finishRef = useRef<(() => void) | null>(null)

  const start = useCallback((totalSec: number, onComplete?: () => void) => {
    endRef.current = Date.now() + totalSec * 1000
    finishRef.current = onComplete ?? null
    setRemaining(Math.max(1, Math.ceil(totalSec)))
    setRunning(true)
  }, [])

  const stop = useCallback(() => {
    endRef.current = null
    finishRef.current = null
    setRunning(false)
    setRemaining(0)
  }, [])

  const addSeconds = useCallback((sec: number) => {
    if (endRef.current == null) return
    endRef.current += sec * 1000
    setRemaining((prev) => Math.max(0, prev + sec))
  }, [])

  useEffect(() => {
    if (!running) return
    let alive = true
    const tick = () => {
      if (!alive || endRef.current == null) return
      const diff = Math.ceil((endRef.current - Date.now()) / 1000)
      if (diff <= 0) {
        endRef.current = null
        setRunning(false)
        setRemaining(0)
        const cb = finishRef.current
        finishRef.current = null
        cb?.()
      } else {
        setRemaining(diff)
      }
    }
    tick()
    const id = window.setInterval(tick, 200)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [running])

  return { remaining, running, start, stop, addSeconds }
}
