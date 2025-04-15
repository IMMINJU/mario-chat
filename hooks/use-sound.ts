"use client"

import { useState, useEffect } from "react"

export function useSound(soundUrl: string) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const audioElement = new Audio(soundUrl)

    audioElement.addEventListener("canplaythrough", () => {
      setIsReady(true)
    })

    setAudio(audioElement)

    return () => {
      audioElement.pause()
      audioElement.src = ""
    }
  }, [soundUrl])

  const play = () => {
    if (audio && isReady) {
      // Reset the audio to the beginning
      audio.currentTime = 0

      // Play with error handling
      audio.play().catch((error) => {
        console.error("Error playing sound:", error)
      })
    }
  }

  return { play, isReady }
}
