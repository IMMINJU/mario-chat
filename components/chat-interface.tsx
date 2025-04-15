"use client"

import { useState, useEffect, useRef } from "react"
import { type Socket, io } from "socket.io-client"
import { useForm } from "react-hook-form"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Send } from "lucide-react"

// 메시지 타입 정의
interface Message {
  id: string
  text: string
  sender: string
  timestamp: Date
}

// 폼 입력 타입 정의
interface FormInput {
  message: string
}

export default function ChatInterface() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [username, setUsername] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // react-hook-form 설정
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>()

  // TanStack Query를 사용하여 이전 메시지 가져오기
  const { data: previousMessages } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const response = await fetch("/api/messages")
      if (!response.ok) {
        throw new Error("메시지를 불러오는데 실패했습니다")
      }
      return response.json() as Promise<Message[]>
    },
    enabled: !!username, // 사용자 이름이 있을 때만 쿼리 실행
  })

  // 이전 메시지 로드
  useEffect(() => {
    if (previousMessages) {
      setMessages(previousMessages)
    }
  }, [previousMessages])

  // 소켓 연결 설정
  useEffect(() => {
    // 랜덤 사용자 이름 생성 (실제 앱에서는 로그인 시스템으로 대체)
    const randomUsername = `user_${Math.floor(Math.random() * 10000)}`
    setUsername(randomUsername)

    // 소켓 연결 - 환경 변수에서 서버 URL 가져오기
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"
    const newSocket = io(socketServerUrl, {
      query: { username: randomUsername },
    })

    setSocket(newSocket)

    // 메시지 수신 이벤트 리스너
    newSocket.on("message", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message])
    })

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      newSocket.disconnect()
    }
  }, [])

  // 메시지 전송 함수
  const onSubmit = (data: FormInput) => {
    if (socket && data.message.trim()) {
      const newMessage: Omit<Message, "id"> = {
        text: data.message,
        sender: username,
        timestamp: new Date(),
      }

      socket.emit("sendMessage", newMessage)
      reset() // 폼 초기화
    }
  }

  // 새 메시지가 추가될 때 스크롤 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>채팅방</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              메시지가 없습니다. 첫 메시지를 보내보세요!
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={message.id || index} className="mb-4">
                <div className={`flex items-start gap-3 ${message.sender === username ? "flex-row-reverse" : ""}`}>
                  <Avatar>
                    <AvatarFallback>{message.sender.charAt(0).toUpperCase()}</AvatarFallback>
                    <AvatarImage src={`/blue-skinned-figure.png?height=40&width=40&query=avatar ${message.sender}`} />
                  </Avatar>
                  <div className={`max-w-[80%] ${message.sender === username ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{message.sender === username ? "나" : message.sender}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        message.sender === username ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                </div>
                {index < messages.length - 1 && <Separator className="my-4" />}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full gap-2">
          <Input
            {...register("message", { required: "메시지를 입력하세요" })}
            placeholder="메시지를 입력하세요..."
            className="flex-1"
          />
          <Button type="submit">
            <Send className="h-4 w-4 mr-2" />
            전송
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
