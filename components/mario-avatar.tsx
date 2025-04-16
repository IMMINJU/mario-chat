import Image from "next/image"
import type { MarioCharacter } from "@/types/chat"

interface MarioAvatarProps {
  character: MarioCharacter
  size?: "sm" | "md" | "lg"
  priority?: boolean
}

export default function MarioAvatar({ character, size = "md", priority = false }: MarioAvatarProps) {
  const sizeClass = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  }

  const characterImages: Record<MarioCharacter, string> = {
    mario: "/mario-avatar.png",
    luigi: "/luigi-avatar.png",
    toad: "/toad-avatar.png",
    peach: "/peach-avatar.png",
    bowser: "/bowser-avatar.png",
    yoshi: "/yoshi-avatar.png",
  }

  return (
    <div className={`${sizeClass[size]} relative flex-shrink-0`}>
      <div className="absolute inset-0 bg-white rounded-full border-2 border-mario-black overflow-hidden">
        <Image
          src={characterImages[character] || "/placeholder.svg"}
          alt={character}
          width={size === "lg" ? 64 : 40}
          height={size === "lg" ? 64 : 40}
          className="object-cover"
          priority={priority}
        />
      </div>
    </div>
  )
}
