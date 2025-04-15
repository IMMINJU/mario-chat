"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, LogOut } from "lucide-react"
import MarioAvatar from "./mario-avatar"
import MarioUsername from "./mario-username"

// 메시지 타입 정의
interface Message {
  id: string
  text: string
  sender: string
  timestamp: Date
  character?: "mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi"
}

// 폼 입력 타입 정의
interface FormInput {
  message: string
}

export default function MarioChatInterface() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [username, setUsername] = useState<string>("")
  const [character, setCharacter] = useState<"mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi">("mario")
  const [showUsernameForm, setShowUsernameForm] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [coinSound] = useState(() => (typeof Audio !== "undefined" ? new Audio("/coin.mp3") : null))

  // react-hook-form 설정
  const { register, handleSubmit, reset } = useForm<FormInput>()

  // 사용자 이름 및 캐릭터 선택 폼
  const { register: registerUsername, handleSubmit: handleSubmitUsername } = useForm<{
    username: string
    character: "mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi"
  }>({
    defaultValues: {
      username: "",
      character: "mario",
    },
  })

  // 소켓 연결 설정
  useEffect(() => {
    if (showUsernameForm) return

    // 소켓 연결
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"
    const newSocket = io(socketServerUrl, {
      query: {
        username,
        character,
      },
    })

    setSocket(newSocket)

    // 시스템 메시지 추가
    setMessages([
      {
        id: "welcome",
        text: `${username}님, 마리오 월드에 오신 것을 환영합니다!`,
        sender: "system",
        timestamp: new Date(),
        character: "toad",
      },
    ])

    // 메시지 수신 이벤트 리스너
    newSocket.on("message", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message])
      if (coinSound) {
        coinSound.currentTime = 0
        coinSound.play().catch((e) => console.log("오디오 재생 실패:", e))
      }
    })

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      newSocket.disconnect()
    }
  }, [showUsernameForm, username, character, coinSound])

  // 메시지 전송 함수
  const onSubmit = (data: FormInput) => {
    if (socket && data.message.trim()) {
      const newMessage: Omit<Message, "id"> = {
        text: data.message,
        sender: username,
        timestamp: new Date(),
        character,
      }

      socket.emit("sendMessage", newMessage)
      reset() // 폼 초기화
    }
  }

  // 사용자 이름 제출
  const onUsernameSubmit = (data: {
    username: string
    character: "mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi"
  }) => {
    setUsername(data.username)
    setCharacter(data.character)
    setShowUsernameForm(false)
  }

  // 새 메시지가 추가될 때 스크롤 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 로그아웃
  const handleLogout = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
    }
    setShowUsernameForm(true)
    setMessages([])
  }

  if (showUsernameForm) {
    return (
      <Card className="mario-card bg-mario-beige pixel-corners">
        <CardHeader className="bg-mario-red text-white font-mario text-center text-sm md:text-base">
          캐릭터 선택
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmitUsername(onUsernameSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="font-mario text-xs md:text-sm text-mario-black">닉네임</label>
              <Input
                {...registerUsername("username", { required: true })}
                className="border-mario-black border-2 font-mario text-xs"
                placeholder="닉네임을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mario text-xs md:text-sm text-mario-black">캐릭터</label>
              <div className="grid grid-cols-3 gap-2">
                {["mario", "luigi", "toad", "peach", "bowser", "yoshi"].map((char) => (
                  <label key={char} className="cursor-pointer">
                    <input type="radio" value={char} {...registerUsername("character")} className="sr-only" />
                    <div
                      className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                        char === character ? "bg-mario-blue text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <MarioAvatar character={char as any} size="lg" />
                      <span className="mt-2 font-mario text-[10px] capitalize">{char}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mario-button bg-mario-green hover:bg-mario-green/90 text-white font-mario text-xs"
            >
              게임 시작!
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mario-card bg-mario-beige pixel-corners">
      <CardHeader className="flex flex-row items-center justify-between bg-mario-red p-4">
        <div className="flex items-center">
          <div className="question-block mr-3"></div>
          <h2 className="font-mario text-white text-xs md:text-sm">마리오 채팅</h2>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="icon"
          className="mario-button bg-mario-yellow hover:bg-mario-yellow/90 h-8 w-8"
        >
          <LogOut className="h-4 w-4 text-mario-black" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-mario-blue p-2 border-y-2 border-mario-black">
          <div className="flex items-center">
            <div className="coin"></div>
            <span className="font-mario text-white text-xs">
              {username} ({character})
            </span>
          </div>
        </div>
        <ScrollArea className="h-[400px] p-4">
          {messages.map((message, index) => (
            <div key={message.id || index} className="mb-4">
              {message.sender === "system" ? (
                <div className="bg-mario-yellow/70 text-mario-black p-2 rounded font-mario text-xs text-center my-2 border-2 border-mario-black">
                  {message.text}
                </div>
              ) : (
                <div className={`flex ${message.sender === username ? "flex-row-reverse" : "flex-row"}`}>
                  <MarioAvatar character={message.character || "mario"} />
                  <div className={`max-w-[80%] mx-2 ${message.sender === username ? "text-right" : "text-left"}`}>
                    <MarioUsername username={message.sender} isCurrentUser={message.sender === username} />
                    <div
                      className={`p-3 rounded-lg border-2 border-mario-black ${
                        message.sender === username ? "bg-mario-green text-white" : "bg-white text-mario-black"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <div className="text-xs text-mario-black/70 mt-1 font-mario text-[8px]">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t-2 border-mario-black p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full gap-2">
          <div className="pipe flex-1 relative">
            <div className="pipe-top"></div>
            <Input
              {...register("message", { required: true })}
              placeholder="메시지를 입력하세요..."
              className="border-none bg-transparent text-white placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button type="submit" className="mario-button bg-mario-red hover:bg-mario-red/90 text-white">
            <Send className="h-4 w-4 mr-2" />
            전송
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
