"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: string
  timestamp: Date
}

export default function ChatInterface() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [username, setUsername] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [usernameSubmitted, setUsernameSubmitted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 사용자 이름이 제출되었을 때만 소켓 연결
    if (!usernameSubmitted) return

    // 소켓 연결
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001")

    setSocket(newSocket)

    // 연결 이벤트 리스너
    newSocket.on("connect", () => {
      setIsConnected(true)
      console.log("Connected to socket server")

      // 사용자 이름 서버에 전송
      newSocket.emit("user:join", username)
    })

    // 메시지 수신 이벤트 리스너
    newSocket.on("message:receive", (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    // 연결 해제 이벤트 리스너
    newSocket.on("disconnect", () => {
      setIsConnected(false)
      console.log("Disconnected from socket server")
    })

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      newSocket.disconnect()
    }
  }, [usernameSubmitted, username])

  // 메시지 목록이 업데이트될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 메시지 전송 함수
  const sendMessage = () => {
    if (messageText.trim() && socket) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        sender: username,
        timestamp: new Date(),
      }

      socket.emit("message:send", newMessage)
      setMessages((prev) => [...prev, newMessage])
      setMessageText("")
    }
  }

  // 엔터 키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  // 사용자 이름 제출
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) {
      setUsernameSubmitted(true)
    }
  }

  if (!usernameSubmitted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>채팅 시작하기</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                사용자 이름
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="사용자 이름을 입력하세요"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              채팅 입장
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
            <span>채팅방</span>
          </div>
          <div className="text-sm font-normal text-muted-foreground">{isConnected ? "연결됨" : "연결 중..."}</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              아직 메시지가 없습니다. 첫 메시지를 보내보세요!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === username ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-2 max-w-[80%] ${message.sender === username ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{message.sender.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div
                        className={`px-3 py-2 rounded-lg ${
                          message.sender === username ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.text}
                      </div>
                      <div
                        className={`text-xs text-muted-foreground mt-1 ${
                          message.sender === username ? "text-right" : "text-left"
                        }`}
                      >
                        {message.sender} • {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-3">
        <div className="flex w-full items-center space-x-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={!isConnected}
          />
          <Button onClick={sendMessage} disabled={!isConnected || !messageText.trim()} size="icon">
            <Send className="h-4 w-4" />
            <span className="sr-only">전송</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
