import Image from "next/image"

type MarioCharacter = "mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi"

interface MarioAvatarProps {
  character: MarioCharacter
  size?: "sm" | "md" | "lg"
}

export default function MarioAvatar({ character, size = "md" }: MarioAvatarProps) {
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
          src={characterImages[character] || "/mario-avatar.png"}
          alt={character}
          width={size === "lg" ? 64 : 40}
          height={size === "lg" ? 64 : 40}
          className="object-cover"
        />
      </div>
    </div>
  )
}
