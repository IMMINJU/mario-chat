"use client"

import { useState, useEffect, useCallback } from "react"
import { io, type Socket } from "socket.io-client"

interface Message {
  id: string
  text: string
  sender: string
  timestamp: Date
}

interface UseChatOptions {
  serverUrl?: string
  username: string
  room?: string
}

export function useChat({ serverUrl, username, room }: UseChatOptions) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // 소켓 연결 설정
  useEffect(() => {
    if (!username) return

    const socketServerUrl = serverUrl || process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"
    const newSocket = io(socketServerUrl, {
      query: {
        username,
        room,
      },
    })

    newSocket.on("connect", () => {
      setIsConnected(true)
    })

    newSocket.on("disconnect", () => {
      setIsConnected(false)
    })

    newSocket.on("message", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message])
    })

    newSocket.on("userList", (userList: string[]) => {
      setUsers(userList)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [serverUrl, username, room])

  // 메시지 전송 함수
  const sendMessage = useCallback(
    (text: string) => {
      if (socket && text.trim()) {
        const messageData = {
          text,
          sender: username,
          timestamp: new Date(),
        }

        socket.emit("sendMessage", messageData)
      }
    },
    [socket, username],
  )

  // 채팅방 나가기
  const leaveChat = useCallback(() => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [socket])

  return {
    messages,
    users,
    isConnected,
    sendMessage,
    leaveChat,
  }
}
