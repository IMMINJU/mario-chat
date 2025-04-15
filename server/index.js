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
    origin: process.env.CLIENT_URL || "*", // Client URL
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Fallback mechanism
})

// 활성 사용자 저장 (최대 2명)
const activeUsers = new Map()
const MAX_USERS = 2

// 메시지 저장 (실제 애플리케이션에서는 데이터베이스 사용)
const messages = []

// 상태 확인 엔드포인트
app.get("/", (req, res) => {
  res.send({
    status: "online",
    connections: activeUsers.size,
    isFull: activeUsers.size >= MAX_USERS,
    uptime: process.uptime(),
  })
})

// 채팅방 상태 확인 API
app.get("/api/room-status", (req, res) => {
  res.json({
    userCount: activeUsers.size,
    isFull: activeUsers.size >= MAX_USERS,
    users: Array.from(activeUsers.values()).map((user) => user.username),
  })
})

// Socket.IO 연결 처리
io.on("connection", (socket) => {
  const username = socket.handshake.query.username
  const character = socket.handshake.query.character

  console.log(`연결 시도: ${username} (${socket.id})`)

  // 채팅방이 가득 찼는지 확인
  if (activeUsers.size >= MAX_USERS) {
    console.log(`채팅방이 가득 참: ${username}의 연결 거부`)
    // 채팅방 가득 참 이벤트 발송
    socket.emit("room:full")
    // 연결 종료
    return socket.disconnect()
  }

  console.log(`사용자 연결됨: ${username} (${socket.id})`)

  // 사용자 추가
  activeUsers.set(socket.id, { username, character })

  // 채팅방 상태 업데이트 브로드캐스트
  io.emit("room:status", {
    userCount: activeUsers.size,
    isFull: activeUsers.size >= MAX_USERS,
    users: Array.from(activeUsers.values()).map((user) => user.username),
  })

  // 시스템 메시지 전송
  const joinMessage = {
    id: uuidv4(),
    text: `${username} has joined the chat`,
    sender: "system",
    timestamp: new Date(),
  }

  messages.push(joinMessage)
  if (messages.length > 100) {
    messages.shift()
  }

  io.emit("message", joinMessage)

  // 사용자 목록 업데이트 및 브로드캐스트
  io.emit(
    "userList",
    Array.from(activeUsers.values()).map((user) => user.username),
  )

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
    const userData = activeUsers.get(socket.id)
    if (userData) {
      console.log(`사용자 연결 해제: ${userData.username} (${socket.id})`)

      // 시스템 메시지 전송
      const leaveMessage = {
        id: uuidv4(),
        text: `${userData.username} has left the chat`,
        sender: "system",
        timestamp: new Date(),
      }

      messages.push(leaveMessage)
      io.emit("message", leaveMessage)

      activeUsers.delete(socket.id)

      // 채팅방 상태 업데이트 브로드캐스트
      io.emit("room:status", {
        userCount: activeUsers.size,
        isFull: activeUsers.size >= MAX_USERS,
        users: Array.from(activeUsers.values()).map((user) => user.username),
      })

      io.emit(
        "userList",
        Array.from(activeUsers.values()).map((user) => user.username),
      )
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
