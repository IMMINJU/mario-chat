"use client"

import { useState, useEffect, useCallback } from "react"

export function useSound(soundUrl: string) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // 오디오 요소 생성 및 preload 설정
    const audioElement = new Audio(soundUrl)
    audioElement.preload = "auto" // 자동으로 미리 로드

    audioElement.addEventListener("canplaythrough", () => {
      setIsReady(true)
    })

    // 오디오 로드 시작
    audioElement.load()

    setAudio(audioElement)

    return () => {
      audioElement.pause()
      audioElement.src = ""
    }
  }, [soundUrl])

  const play = useCallback(() => {
    if (audio && isReady) {
      // Reset the audio to the beginning
      audio.currentTime = 0

      // Play with error handling
      audio.play().catch((error) => {
        console.error("Error playing sound:", error)
      })
    }
  }, [audio, isReady])

  return { play, isReady }
}
