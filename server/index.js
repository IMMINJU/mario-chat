const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const { v4: uuidv4 } = require("uuid")

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*", // Vercel 앱 URL
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // 폴백 메커니즘 지원
})

// 활성 사용자 저장
const activeUsers = new Map()

// 메시지 저장 (실제 애플리케이션에서는 데이터베이스 사용)
const messages = []

// 상태 확인 엔드포인트
app.get("/", (req, res) => {
  res.send({
    status: "online",
    connections: activeUsers.size,
    uptime: process.uptime(),
  })
})

// Socket.IO 연결 처리
io.on("connection", (socket) => {
  const username = socket.handshake.query.username
  console.log(`사용자 연결됨: ${username} (${socket.id})`)

  // 사용자 추가
  activeUsers.set(socket.id, username)

  // 시스템 메시지 전송
  const joinMessage = {
    id: uuidv4(),
    text: `${username}님이 입장하셨습니다.`,
    sender: "system",
    timestamp: new Date(),
  }
  io.emit("message", joinMessage)

  // 사용자 목록 업데이트 및 브로드캐스트
  io.emit("userList", Array.from(activeUsers.values()))

  // 메시지 수신 및 브로드캐스트
  socket.on("sendMessage", (messageData) => {
    const message = {
      id: uuidv4(),
      ...messageData,
      timestamp: new Date(),
    }

    // 최근 메시지 저장 (최대 100개)
    messages.push(message)
    if (messages.length > 100) {
      messages.shift()
    }

    io.emit("message", message)
  })

  // 연결 해제
  socket.on("disconnect", () => {
    const user = activeUsers.get(socket.id)
    if (user) {
      console.log(`사용자 연결 해제: ${user} (${socket.id})`)

      // 시스템 메시지 전송
      const leaveMessage = {
        id: uuidv4(),
        text: `${user}님이 퇴장하셨습니다.`,
        sender: "system",
        timestamp: new Date(),
      }
      io.emit("message", leaveMessage)

      activeUsers.delete(socket.id)
      io.emit("userList", Array.from(activeUsers.values()))
    }
  })
})

// 최근 메시지 가져오기 API
app.get("/api/messages", (req, res) => {
  res.json(messages)
})

// 서버 시작
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.IO 서버가 포트 ${PORT}에서 실행 중입니다`)
})
