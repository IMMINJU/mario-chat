"use client"

import { useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket(username: string, room?: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return

    try {
      // 환경 변수에서 Socket.IO 서버 URL 가져오기
      const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL

      if (!socketServerUrl) {
        setError("Socket.IO 서버 URL이 설정되지 않았습니다")
        return
      }

      // Socket.IO 연결 설정
      const newSocket = io(socketServerUrl, {
        query: { username, room },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ["websocket", "polling"], // 폴백 메커니즘 지원
      })

      // 연결 이벤트 리스너
      newSocket.on("connect", () => {
        console.log("Socket.IO 서버에 연결되었습니다")
        setIsConnected(true)
        setError(null)
      })

      // 연결 오류 이벤트 리스너
      newSocket.on("connect_error", (err) => {
        console.error("Socket.IO 연결 오류:", err.message)
        setError(`연결 오류: ${err.message}`)
        setIsConnected(false)
      })

      // 연결 해제 이벤트 리스너
      newSocket.on("disconnect", (reason) => {
        console.log("Socket.IO 서버와 연결이 끊어졌습니다:", reason)
        setIsConnected(false)
      })

      setSocket(newSocket)

      // 컴포넌트 언마운트 시 소켓 연결 해제
      return () => {
        newSocket.disconnect()
      }
    } catch (err) {
      console.error("Socket.IO 초기화 오류:", err)
      setError("Socket.IO 초기화 중 오류가 발생했습니다")
    }
  }, [username, room])

  return { socket, isConnected, error }
}
