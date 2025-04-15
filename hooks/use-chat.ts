"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import type { Message, User, MarioCharacter } from "@/types/chat"

interface UseChatOptions {
  username: string
  character: MarioCharacter
}

interface UseChatReturn {
  messages: Message[]
  users: User[]
  isConnected: boolean
  isTyping: Record<string, boolean>
  sendMessage: (text: string) => void
  startTyping: () => void
  stopTyping: () => void
  disconnect: () => void
}

export function useChat({ username, character }: UseChatOptions): UseChatReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({})
  const socketRef = useRef<Socket | null>(null)
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})

  // Initialize socket connection
  useEffect(() => {
    if (!username) return

    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"
    const newSocket = io(socketServerUrl, {
      query: {
        username,
        character,
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    // Add welcome message
    setMessages([
      {
        id: "welcome",
        text: `Welcome to Mario World, ${username}!`,
        sender: "system",
        timestamp: new Date(),
        character: "toad",
        isSystem: true,
      },
    ])

    // Socket event listeners
    newSocket.on("connect", () => {
      setIsConnected(true)
      console.log("Connected to socket server")
    })

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error)
      setIsConnected(false)
    })

    newSocket.on("message", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message])
    })

    newSocket.on("userList", (userList: User[]) => {
      setUsers(userList)
    })

    newSocket.on("userTyping", ({ userId, username, isTyping: typing }) => {
      setIsTyping((prev) => ({ ...prev, [userId]: typing }))

      // Clear previous timeout if exists
      if (typingTimeoutRef.current[userId]) {
        clearTimeout(typingTimeoutRef.current[userId])
      }

      // Set timeout to clear typing indicator after 3 seconds
      if (typing) {
        typingTimeoutRef.current[userId] = setTimeout(() => {
          setIsTyping((prev) => ({ ...prev, [userId]: false }))
        }, 3000)
      }
    })

    newSocket.on("disconnect", () => {
      setIsConnected(false)
      console.log("Disconnected from socket server")
    })

    return () => {
      Object.values(typingTimeoutRef.current).forEach(clearTimeout)
      newSocket.disconnect()
    }
  }, [username, character])

  // Send message function
  const sendMessage = useCallback(
    (text: string) => {
      if (!socketRef.current || !text.trim()) return

      const newMessage: Omit<Message, "id"> = {
        text: text.trim(),
        sender: username,
        timestamp: new Date(),
        character,
      }

      socketRef.current.emit("sendMessage", newMessage)
      stopTyping()
    },
    [username, character],
  )

  // Start typing indicator
  const startTyping = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("typing", { isTyping: true })
    }
  }, [])

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("typing", { isTyping: false })
    }
  }, [])

  // Disconnect function
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      setIsConnected(false)
    }
  }, [])

  return {
    messages,
    users,
    isConnected,
    isTyping,
    sendMessage,
    startTyping,
    stopTyping,
    disconnect,
  }
}
