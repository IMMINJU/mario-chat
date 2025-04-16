"use client"

import { useState, useEffect, useCallback } from "react"

interface UseCountdownProps {
  initialSeconds: number
  onComplete?: () => void
  autoStart?: boolean
}

export function useCountdown({ initialSeconds, onComplete, autoStart = true }: UseCountdownProps) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isActive, setIsActive] = useState(autoStart)
  const [isCompleted, setIsCompleted] = useState(false)

  const start = useCallback(() => {
    setIsActive(true)
    setIsCompleted(false)
  }, [])

  const pause = useCallback(() => {
    setIsActive(false)
  }, [])

  const reset = useCallback(() => {
    setSeconds(initialSeconds)
    setIsActive(false)
    setIsCompleted(false)
  }, [initialSeconds])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1)
      }, 1000)
    } else if (isActive && seconds === 0) {
      setIsActive(false)
      setIsCompleted(true)
      if (onComplete) {
        onComplete()
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, seconds, onComplete])

  return {
    seconds,
    isActive,
    isCompleted,
    start,
    pause,
    reset,
    formattedTime: `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`,
  }
}
