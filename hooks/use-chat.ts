"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import type { Message, User, MarioCharacter } from "@/types/chat"
import { useCountdown } from "./use-countdown"

interface UseChatOptions {
  username: string
  character: MarioCharacter
}

interface UseChatReturn {
  messages: Message[]
  users: User[]
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  isTyping: Record<string, boolean>
  connectionCountdown: {
    seconds: number
    formattedTime: string
    isActive: boolean
  }
  sendMessage: (text: string) => void
  startTyping: () => void
  stopTyping: () => void
  disconnect: () => void
  reconnect: () => void
}

export function useChat({ username, character }: UseChatOptions): UseChatReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({})
  const socketRef = useRef<Socket | null>(null)
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})

  // Connection timeout countdown
  const { seconds, formattedTime, isActive, pause, reset, start } = useCountdown({
    initialSeconds: 60,
    autoStart: false,
    onComplete: () => {
      // Handle connection timeout
      if (!isConnected && socketRef.current) {
        socketRef.current.disconnect()
        setConnectionError("Connection timed out after 60 seconds. Please try again.")
        setIsConnecting(false)
      }
    },
  })

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!username) return

    // Reset state
    setConnectionError(null)
    setIsConnecting(true)

    // Start countdown
    reset()
    start()

    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"
    const newSocket = io(socketServerUrl, {
      query: {
        username,
        character,
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 60000, // 60 seconds timeout
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
      setIsConnecting(false)
      setConnectionError(null)
      pause() // Stop countdown on successful connection
      console.log("Connected to socket server")
    })

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error)
      setConnectionError(`Connection error: ${error.message}`)
      setIsConnected(false)
      setIsConnecting(false)
      pause() // Stop countdown on error
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
      setIsConnecting(false)
      console.log("Disconnected from socket server")
    })

    return () => {
      Object.values(typingTimeoutRef.current).forEach(clearTimeout)
      newSocket.disconnect()
    }
  }, [username, character, pause, reset, start])

  // Initialize socket when username is provided
  useEffect(() => {
    if (username) {
      const cleanup = initializeSocket()
      return cleanup
    }
  }, [username, initializeSocket])

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
      setIsConnecting(false)
    }
  }, [])

  // Reconnect function
  const reconnect = useCallback(() => {
    disconnect()
    initializeSocket()
  }, [disconnect, initializeSocket])

  return {
    messages,
    users,
    isConnected,
    isConnecting,
    connectionError,
    isTyping,
    connectionCountdown: {
      seconds,
      formattedTime,
      isActive,
    },
    sendMessage,
    startTyping,
    stopTyping,
    disconnect,
    reconnect,
  }
}
