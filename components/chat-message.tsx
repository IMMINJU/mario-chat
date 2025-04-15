import type { Message } from "@/types/chat"
import MarioAvatar from "./mario-avatar"
import MarioUsername from "./mario-username"

interface ChatMessageProps {
  message: Message
  currentUsername: string
}

export default function ChatMessage({ message, currentUsername }: ChatMessageProps) {
  const isCurrentUser = message.sender === currentUsername
  const isSystem = message.isSystem || message.sender === "system"

  if (isSystem) {
    return (
      <div className="bg-mario-yellow/70 text-mario-black p-2 rounded font-mario text-xs text-center my-2 border-2 border-mario-black">
        {message.text}
      </div>
    )
  }

  return (
    <div className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
      <MarioAvatar character={message.character || "mario"} />
      <div className={`max-w-[80%] mx-2 ${isCurrentUser ? "text-right" : "text-left"}`}>
        <MarioUsername username={message.sender} isCurrentUser={isCurrentUser} />
        <div
          className={`p-3 rounded-lg border-2 border-mario-black ${
            isCurrentUser ? "bg-mario-green text-white" : "bg-white text-mario-black"
          }`}
          aria-label={`Message from ${isCurrentUser ? "you" : message.sender}`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
        <div className="text-xs text-mario-black/70 mt-1 font-mario text-[8px]">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
