"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useChat } from "@/hooks/use-chat"
import { useSound } from "@/hooks/use-sound"
import type { MarioCharacter } from "@/types/chat"
import UserForm from "./user-form"
import MessageList from "./message-list"
import MessageForm from "./message-form"

export default function MarioChatInterface() {
  const [username, setUsername] = useState<string>("")
  const [character, setCharacter] = useState<MarioCharacter>("mario")
  const [showUsernameForm, setShowUsernameForm] = useState(true)

  const { coinSound } = useSound("/coin.mp3")

  // Only initialize chat when user has submitted their username
  const chat = useChat({
    username: showUsernameForm ? "" : username,
    character,
  })

  // Handle user form submission
  const handleUserSubmit = useCallback((data: { username: string; character: MarioCharacter }) => {
    setUsername(data.username)
    setCharacter(data.character)
    setShowUsernameForm(false)
  }, [])

  // Handle message sending
  const handleSendMessage = useCallback(
    (message: string) => {
      chat.sendMessage(message)
      coinSound.play()
    },
    [chat, coinSound],
  )

  // Handle logout
  const handleLogout = useCallback(() => {
    chat.disconnect()
    setShowUsernameForm(true)
  }, [chat])

  // Get list of users who are currently typing
  const typingUsers = useMemo(() => {
    return Object.entries(chat.isTyping)
      .filter(([_, isTyping]) => isTyping)
      .map(([userId]) => {
        const user = chat.users.find((u) => u.id === userId)
        return user ? user.username : ""
      })
      .filter(Boolean)
  }, [chat.isTyping, chat.users])

  if (showUsernameForm) {
    return <UserForm onSubmit={handleUserSubmit} defaultCharacter={character} />
  }

  return (
    <Card className="mario-card bg-mario-beige pixel-corners">
      <CardHeader className="flex flex-row items-center justify-between bg-mario-red p-4">
        <div className="flex items-center">
          <div className="question-block mr-3" aria-hidden="true"></div>
          <h2 className="font-mario text-white text-xs md:text-sm">Mario Chat</h2>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${chat.isConnected ? "bg-green-500" : "bg-red-500"}`}
            aria-hidden="true"
          />
          <span className="text-xs text-white font-mario">{chat.isConnected ? "Connected" : "Connecting..."}</span>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="icon"
            className="mario-button bg-mario-yellow hover:bg-mario-yellow/90 h-8 w-8"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4 text-mario-black" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-mario-blue p-2 border-y-2 border-mario-black">
          <div className="flex items-center">
            <div className="coin" aria-hidden="true"></div>
            <span className="font-mario text-white text-xs">
              {username} ({character})
            </span>
          </div>
        </div>

        <MessageList messages={chat.messages} currentUsername={username} typingUsers={typingUsers} />
      </CardContent>
      <CardFooter className="border-t-2 border-mario-black p-4">
        <MessageForm
          onSendMessage={handleSendMessage}
          onTypingStart={chat.startTyping}
          onTypingStop={chat.stopTyping}
          isConnected={chat.isConnected}
        />
      </CardFooter>
    </Card>
  )
}
