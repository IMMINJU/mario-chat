"use client"

import { useState, useEffect } from "react"
import { io, type Socket } from "socket.io-client"
import UserForm from "@/components/user-form"
import ChatRoom from "@/components/chat-room"

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [username, setUsername] = useState<string>("")
  const [room, setRoom] = useState<string | undefined>(undefined)

  const handleJoin = (newUsername: string, newRoom?: string) => {
    setUsername(newUsername)
    setRoom(newRoom)

    // 소켓 연결 - 환경 변수에서 서버 URL 가져오기
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"
    const newSocket = io(socketServerUrl, {
      query: {
        username: newUsername,
        room: newRoom,
      },
    })

    setSocket(newSocket)
  }

  const handleLeave = () => {
    setUsername("")
    setRoom(undefined)
    setSocket(null)
  }

  // 컴포넌트 언마운트 시 소켓 연결 해제
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [socket])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center">실시간 채팅</h1>

        {!socket ? (
          <UserForm onJoin={handleJoin} />
        ) : (
          <ChatRoom socket={socket} username={username} room={room} onLeave={handleLeave} />
        )}
      </div>
    </main>
  )
}
