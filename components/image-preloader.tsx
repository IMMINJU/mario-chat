"use client"

import { useEffect } from "react"
import type { MarioCharacter } from "@/types/chat"

export default function ImagePreloader() {
  useEffect(() => {
    // 모든 캐릭터 이미지 미리 로드
    const characterImages: Record<MarioCharacter, string> = {
      mario: "/mario-avatar.png",
      luigi: "/luigi-avatar.png",
      toad: "/toad-avatar.png",
      peach: "/peach-avatar.png",
      bowser: "/bowser-avatar.png",
      yoshi: "/yoshi-avatar.png",
    }

    // 이미지 미리 로드 함수
    const preloadImage = (src: string) => {
      const img = new Image()
      img.src = src
    }

    // 모든 캐릭터 이미지 미리 로드
    Object.values(characterImages).forEach(preloadImage)

    // 기타 UI 이미지 미리 로드
    preloadImage("/question-block.png")
  }, [])

  return null
}
