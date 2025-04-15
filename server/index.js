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
    origin: "http://localhost:3000", // 클라이언트 URL
    methods: ["GET", "POST"],
  },
})

// 활성 사용자 저장
const activeUsers = new Map()

// 메시지 저장 (실제 애플리케이션에서는 데이터베이스 사용)
const messages = []

io.on("connection", (socket) => {
  const username = socket.handshake.query.username
  console.log(`사용자 연결됨: ${username}`)

  // 사용자 추가
  activeUsers.set(socket.id, username)

  // 사용자 목록 업데이트 및 브로드캐스트
  io.emit("userList", Array.from(activeUsers.values()))

  // 메시지 수신 및 브로드캐스트
  socket.on("sendMessage", (messageData) => {
    const message = {
      id: uuidv4(),
      ...messageData,
      timestamp: new Date(),
    }

    messages.push(message)
    io.emit("message", message)
  })

  // 연결 해제
  socket.on("disconnect", () => {
    console.log(`사용자 연결 해제: ${activeUsers.get(socket.id)}`)
    activeUsers.delete(socket.id)
    io.emit("userList", Array.from(activeUsers.values()))
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`)
})
