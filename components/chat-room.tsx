"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSocket } from "@/hooks/use-socket"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Send, LogOut, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// 메시지 타입 정의
interface Message {
  id: string
  text: string
  sender: string
  timestamp: Date
}

// 폼 스키마 정의
const formSchema = z.object({
  message: z.string().min(1, {
    message: "메시지를 입력하세요.",
  }),
})

type FormValues = z.infer<typeof formSchema>

interface ChatRoomProps {
  username: string
  room?: string
  onLeave: () => void
}

export default function ChatRoom({ username, room, onLeave }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { socket, isConnected, error } = useSocket(username, room)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  })

  // TanStack Query를 사용하여 이전 메시지 가져오기
  const { data: previousMessages, isError } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL
      const response = await fetch(`${socketServerUrl}/api/messages`)
      if (!response.ok) {
        throw new Error("메시지를 불러오는데 실패했습니다")
      }
      return response.json() as Promise<Message[]>
    },
    enabled: isConnected, // 소켓이 연결되었을 때만 쿼리 실행
  })

  // 이전 메시지 로드
  useEffect(() => {
    if (previousMessages && previousMessages.length > 0) {
      setMessages(previousMessages)
    }
  }, [previousMessages])

  // 메시지 수신 이벤트 리스너
  useEffect(() => {
    if (!socket) return

    socket.on("message", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message])
    })

    socket.on("userList", (userList: string[]) => {
      setUsers(userList)
    })

    return () => {
      socket.off("message")
      socket.off("userList")
    }
  }, [socket])

  // 새 메시지가 추가될 때 스크롤 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function onSubmit(values: FormValues) {
    if (socket && values.message.trim() && isConnected) {
      const newMessage: Omit<Message, "id"> = {
        text: values.message,
        sender: username,
        timestamp: new Date(),
      }

      socket.emit("sendMessage", newMessage)
      form.reset()
    }
  }

  function handleLeave() {
    if (socket) {
      socket.disconnect()
    }
    onLeave()
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{room ? `채팅방: ${room}` : "일반 채팅"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            접속자 수: {users.length} • {isConnected ? "연결됨" : "연결 중..."}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={handleLeave}>
          <LogOut className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>연결 오류</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <ScrollArea className="h-[500px] p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              메시지가 없습니다. 첫 메시지를 보내보세요!
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={message.id || index} className="mb-4">
                {message.sender === "system" ? (
                  <div className="flex justify-center">
                    <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                      {message.text}
                    </span>
                  </div>
                ) : (
                  <div className={`flex items-start gap-3 ${message.sender === username ? "flex-row-reverse" : ""}`}>
                    <Avatar>
                      <AvatarFallback>{message.sender.charAt(0).toUpperCase()}</AvatarFallback>
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
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full gap-2">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="메시지를 입력하세요..." disabled={!isConnected} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={!isConnected}>
              <Send className="h-4 w-4 mr-2" />
              전송
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  )
}
