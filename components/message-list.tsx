"use client"

import { useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "@/types/chat"
import ChatMessage from "./chat-message"

interface MessageListProps {
  messages: Message[]
  currentUsername: string
  typingUsers: string[]
}

export default function MessageList({ messages, currentUsername, typingUsers }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <ScrollArea className="h-[400px] p-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-mario-black/70 font-mario text-xs">
          No messages yet. Start the conversation!
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message, index) => (
            <ChatMessage key={message.id || index} message={message} currentUsername={currentUsername} />
          ))}

          {typingUsers.length > 0 && (
            <div className="text-xs text-mario-black/70 italic">
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </ScrollArea>
  )
}
