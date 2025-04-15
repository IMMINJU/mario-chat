const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const { v4: uuidv4 } = require("uuid")

// Initialize Express app
const app = express()
app.use(cors())

// Create HTTP server
const server = http.createServer(app)

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*", // Vercel app URL
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Support fallback mechanisms
})

// Store active users
const activeUsers = new Map()

// Store messages (in a real app, use a database)
const messages = []

// Maximum number of stored messages
const MAX_MESSAGES = 100

// Health check endpoint
app.get("/", (req, res) => {
  res.send({
    status: "online",
    connections: activeUsers.size,
    uptime: process.uptime(),
  })
})

// Socket.IO connection handler
io.on("connection", (socket) => {
  const username = socket.handshake.query.username
  const character = socket.handshake.query.character
  const userId = socket.id

  console.log(`User connected: ${username} (${userId})`)

  // Add user to active users
  activeUsers.set(userId, {
    id: userId,
    username,
    character,
    isOnline: true,
  })

  // Send system message
  const joinMessage = {
    id: uuidv4(),
    text: `${username} has joined the chat!`,
    sender: "system",
    timestamp: new Date(),
    isSystem: true,
  }
  io.emit("message", joinMessage)

  // Update and broadcast user list
  broadcastUserList()

  // Send recent message history to new user
  socket.emit("messageHistory", messages.slice(-50))

  // Handle message sending
  socket.on("sendMessage", (messageData) => {
    const message = {
      id: uuidv4(),
      ...messageData,
      timestamp: new Date(),
    }

    // Store message (limit to MAX_MESSAGES)
    messages.push(message)
    if (messages.length > MAX_MESSAGES) {
      messages.shift()
    }

    // Broadcast message to all clients
    io.emit("message", message)
  })

  // Handle typing indicator
  socket.on("typing", ({ isTyping }) => {
    const user = activeUsers.get(userId)
    if (user) {
      io.emit("userTyping", {
        userId,
        username: user.username,
        isTyping,
      })
    }
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    const user = activeUsers.get(userId)
    if (user) {
      console.log(`User disconnected: ${user.username} (${userId})`)

      // Send system message
      const leaveMessage = {
        id: uuidv4(),
        text: `${user.username} has left the chat.`,
        sender: "system",
        timestamp: new Date(),
        isSystem: true,
      }
      io.emit("message", leaveMessage)

      // Remove user from active users
      activeUsers.delete(userId)

      // Update and broadcast user list
      broadcastUserList()
    }
  })

  // Helper function to broadcast user list
  function broadcastUserList() {
    io.emit("userList", Array.from(activeUsers.values()))
  }
})

// API to get recent messages
app.get("/api/messages", (req, res) => {
  res.json(messages)
})

// API to get active users
app.get("/api/users", (req, res) => {
  res.json(Array.from(activeUsers.values()))
})

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})
