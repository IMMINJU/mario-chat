"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, LogOut, Users, AlertCircle } from "lucide-react"
import MarioAvatar from "./mario-avatar"
import MarioUsername from "./mario-username"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

// 채팅방 상태 타입 정의
interface RoomStatus {
  userCount: number
  isFull: boolean
  users: string[]
}

export default function MarioChatInterface() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [username, setUsername] = useState<string>("")
  const [character, setCharacter] = useState<"mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi">("mario")
  const [showUsernameForm, setShowUsernameForm] = useState(true)
  const [isRoomFull, setIsRoomFull] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [roomStatus, setRoomStatus] = useState<RoomStatus>({ userCount: 0, isFull: false, users: [] })
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [coinSound] = useState(() => (typeof Audio !== "undefined" ? new Audio("/coin.mp3") : null))
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

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

  // 채팅방 상태 확인
  useEffect(() => {
    if (showUsernameForm && !isConnecting) {
      const checkRoomStatus = async () => {
        try {
          const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"
          const response = await fetch(`${socketServerUrl}/api/room-status`)
          const data = await response.json()
          setRoomStatus(data)
          setIsRoomFull(data.isFull)
        } catch (error) {
          console.error("Failed to check room status:", error)
        }
      }

      checkRoomStatus()

      // 5초마다 채팅방 상태 확인
      const intervalId = setInterval(checkRoomStatus, 5000)
      return () => clearInterval(intervalId)
    }
  }, [showUsernameForm, isConnecting])

  // 소켓 연결 설정
  useEffect(() => {
    if (showUsernameForm || !username) return

    setIsConnecting(true)
    setConnectionError(null)

    // 소켓 연결
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"
    const newSocket = io(socketServerUrl, {
      query: {
        username,
        character,
      },
    })

    setSocket(newSocket)

    // 연결 이벤트 리스너
    newSocket.on("connect", () => {
      setIsConnecting(false)
      console.log("Connected to socket server")

      // 시스템 메시지 추가
      setMessages([
        {
          id: "welcome",
          text: `Welcome to Mario World, ${username}!`,
          sender: "system",
          timestamp: new Date(),
          character: "toad",
        },
      ])
    })

    // 채팅방 가득 참 이벤트 리스너
    newSocket.on("room:full", () => {
      setIsRoomFull(true)
      setIsConnecting(false)
      setConnectionError("Chat room is full! Please try again later.")
      setShowUsernameForm(true)
      newSocket.disconnect()

      // 자동 재연결 시도 (10초마다)
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }

      reconnectTimerRef.current = setTimeout(() => {
        if (isRoomFull) {
          setShowUsernameForm(false) // 재연결 시도
        }
      }, 10000)
    })

    // 채팅방 상태 업데이트 리스너
    newSocket.on("room:status", (status: RoomStatus) => {
      setRoomStatus(status)
    })

    // 메시지 수신 이벤트 리스너
    newSocket.on("message", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message])
      if (coinSound) {
        coinSound.currentTime = 0
        coinSound.play().catch((e) => console.log("오디오 재생 실패:", e))
      }
    })

    // 연결 오류 이벤트 리스너
    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error)
      setConnectionError("Failed to connect to the chat server. Please try again.")
      setIsConnecting(false)
      setShowUsernameForm(true)
    })

    // 연결 해제 이벤트 리스너
    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason)
      if (reason === "io server disconnect") {
        setConnectionError("You were disconnected by the server.")
      }
      setIsConnecting(false)
    })

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      newSocket.disconnect()
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
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
    setConnectionError(null)
  }

  if (showUsernameForm) {
    return (
      <Card className="mario-card bg-mario-beige pixel-corners">
        <CardHeader className="bg-mario-red text-white font-mario text-center text-sm md:text-base">
          캐릭터 선택
        </CardHeader>
        <CardContent className="p-6">
          {isRoomFull && (
            <Alert className="mb-4 bg-mario-red/20 border-mario-red">
              <AlertCircle className="h-4 w-4 text-mario-red" />
              <AlertTitle className="font-mario text-xs text-mario-red">Chat Room Full!</AlertTitle>
              <AlertDescription className="text-xs">
                The chat room is currently full (2/2 players). Please try again later.
                <div className="mt-2 font-mario text-[10px]">Current players: {roomStatus.users.join(", ")}</div>
              </AlertDescription>
            </Alert>
          )}

          {connectionError && (
            <Alert className="mb-4 bg-mario-red/20 border-mario-red">
              <AlertCircle className="h-4 w-4 text-mario-red" />
              <AlertTitle className="font-mario text-xs text-mario-red">Connection Error</AlertTitle>
              <AlertDescription className="text-xs">{connectionError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmitUsername(onUsernameSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="font-mario text-xs md:text-sm text-mario-black">Nickname</label>
              <Input
                {...registerUsername("username", { required: true })}
                className="border-mario-black border-2 font-mario text-xs"
                placeholder="Enter your nickname"
                disabled={isRoomFull || isConnecting}
              />
            </div>

            <div className="space-y-2">
              <label className="font-mario text-xs md:text-sm text-mario-black">Character</label>
              <div className="grid grid-cols-3 gap-2">
                {["mario", "luigi", "toad", "peach", "bowser", "yoshi"].map((char) => {
                  return (
                    <label key={char} className="cursor-pointer">
                      <input
                        type="radio"
                        value={char}
                        {...registerUsername("character")}
                        className="sr-only"
                        onChange={() => setCharacter(char as any)}
                        disabled={isRoomFull || isConnecting}
                      />
                      <div
                        className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                          char === character ? "bg-mario-blue text-white" : "bg-gray-100 hover:bg-gray-200"
                        } ${isRoomFull || isConnecting ? "opacity-50" : ""}`}
                      >
                        <MarioAvatar character={char as any} size="lg" />
                        <span className="mt-2 font-mario text-[10px] capitalize">{char}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="text-center font-mario text-xs text-mario-black">
              {roomStatus.userCount}/2 players online
            </div>

            <Button
              type="submit"
              className="w-full mario-button bg-mario-green hover:bg-mario-green/90 text-white font-mario text-xs"
              disabled={isRoomFull || isConnecting}
            >
              {isConnecting ? "Connecting..." : isRoomFull ? "Room Full" : "Start Game!"}
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
          <h2 className="font-mario text-white text-xs md:text-sm">Mario Chat (2 Players)</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-mario-yellow px-2 py-1 rounded font-mario text-[10px] text-mario-black">
            {roomStatus.userCount}/2
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="icon"
            className="mario-button bg-mario-yellow hover:bg-mario-yellow/90 h-8 w-8"
          >
            <LogOut className="h-4 w-4 text-mario-black" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-mario-blue p-2 border-y-2 border-mario-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="coin"></div>
              <span className="font-mario text-white text-xs">
                {username} ({character})
              </span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-white mr-1" />
              <span className="font-mario text-white text-xs">
                {roomStatus.users.filter((user) => user !== username).join(", ") || "Waiting for player..."}
              </span>
            </div>
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
              placeholder="Type your message..."
              className="border-none bg-transparent text-white placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button type="submit" className="mario-button bg-mario-red hover:bg-mario-red/90 text-white">
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
