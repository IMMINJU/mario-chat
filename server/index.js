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

// Store active users
const activeUsers = new Map()

// Store chat rooms
const chatRooms = new Map([
  ["general", { name: "General", messages: [] }],
  ["mushroom-kingdom", { name: "Mushroom Kingdom", messages: [] }],
  ["bowser-castle", { name: "Bowser's Castle", messages: [] }],
])

// Store typing status
const typingUsers = new Map()

// Status check endpoint
app.get("/", (req, res) => {
  res.send({
    status: "online",
    connections: activeUsers.size,
    rooms: Array.from(chatRooms.keys()),
    uptime: process.uptime(),
  })
})

// Get rooms list
app.get("/api/rooms", (req, res) => {
  const roomsList = Array.from(chatRooms.entries()).map(([id, room]) => ({
    id,
    name: room.name,
    userCount: getActiveUsersInRoom(id).length,
  }))
  res.json(roomsList)
})

// Get messages for a specific room
app.get("/api/messages/:roomId", (req, res) => {
  const roomId = req.params.roomId
  const room = chatRooms.get(roomId)

  if (!room) {
    return res.status(404).json({ error: "Room not found" })
  }

  res.json(room.messages)
})

// Helper function to get active users in a room
function getActiveUsersInRoom(roomId) {
  const usersInRoom = []
  for (const [socketId, userData] of activeUsers.entries()) {
    if (userData.room === roomId) {
      usersInRoom.push({
        id: socketId,
        username: userData.username,
        character: userData.character,
      })
    }
  }
  return usersInRoom
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  const username = socket.handshake.query.username
  const character = socket.handshake.query.character
  const initialRoom = socket.handshake.query.room || "general"

  console.log(`User connected: ${username} (${socket.id})`)

  // Add user to active users
  activeUsers.set(socket.id, {
    username,
    character,
    room: initialRoom,
  })

  // Join the initial room
  socket.join(initialRoom)

  // Send room history to the user
  const roomData = chatRooms.get(initialRoom)
  if (roomData) {
    socket.emit("roomHistory", roomData.messages)
  }

  // Send system message about user joining
  const joinMessage = {
    id: uuidv4(),
    text: `${username} has joined the chat`,
    sender: "system",
    timestamp: new Date(),
    room: initialRoom,
  }

  // Add message to room history
  if (chatRooms.has(initialRoom)) {
    chatRooms.get(initialRoom).messages.push(joinMessage)
    // Keep only the last 100 messages
    if (chatRooms.get(initialRoom).messages.length > 100) {
      chatRooms.get(initialRoom).messages.shift()
    }
  }

  // Broadcast join message to the room
  io.to(initialRoom).emit("message", joinMessage)

  // Update user list for the room
  io.to(initialRoom).emit("userList", getActiveUsersInRoom(initialRoom))

  // Handle room change
  socket.on("joinRoom", (newRoom) => {
    const oldRoom = activeUsers.get(socket.id).room

    // Leave old room
    socket.leave(oldRoom)

    // Send leave message to old room
    const leaveMessage = {
      id: uuidv4(),
      text: `${username} has left the chat`,
      sender: "system",
      timestamp: new Date(),
      room: oldRoom,
    }

    if (chatRooms.has(oldRoom)) {
      chatRooms.get(oldRoom).messages.push(leaveMessage)
    }

    io.to(oldRoom).emit("message", leaveMessage)

    // Update user's room
    activeUsers.set(socket.id, {
      ...activeUsers.get(socket.id),
      room: newRoom,
    })

    // Join new room
    socket.join(newRoom)

    // Send room history to the user
    const roomData = chatRooms.get(newRoom)
    if (roomData) {
      socket.emit("roomHistory", roomData.messages)
    }

    // Send join message to new room
    const joinNewRoomMessage = {
      id: uuidv4(),
      text: `${username} has joined the chat`,
      sender: "system",
      timestamp: new Date(),
      room: newRoom,
    }

    if (chatRooms.has(newRoom)) {
      chatRooms.get(newRoom).messages.push(joinNewRoomMessage)
    }

    io.to(newRoom).emit("message", joinNewRoomMessage)

    // Update user lists for both rooms
    io.to(oldRoom).emit("userList", getActiveUsersInRoom(oldRoom))
    io.to(newRoom).emit("userList", getActiveUsersInRoom(newRoom))
  })

  // Handle message sending
  socket.on("sendMessage", (messageData) => {
    const room = activeUsers.get(socket.id).room

    const message = {
      id: uuidv4(),
      ...messageData,
      timestamp: new Date(),
      room,
    }

    // Add message to room history
    if (chatRooms.has(room)) {
      chatRooms.get(room).messages.push(message)
      // Keep only the last 100 messages
      if (chatRooms.get(room).messages.length > 100) {
        chatRooms.get(room).messages.shift()
      }
    }

    // Broadcast message to the room
    io.to(room).emit("message", message)

    // Clear typing indicator for this user
    socket.to(room).emit("userStoppedTyping", socket.id)
    typingUsers.delete(socket.id)
  })

  // Handle typing indicator
  socket.on("typing", () => {
    const userData = activeUsers.get(socket.id)
    if (!userData) return

    const room = userData.room

    // Set typing status with timeout
    if (!typingUsers.has(socket.id)) {
      typingUsers.set(socket.id, true)
      socket.to(room).emit("userTyping", {
        id: socket.id,
        username: userData.username,
      })
    }
  })

  socket.on("stoppedTyping", () => {
    const userData = activeUsers.get(socket.id)
    if (!userData) return

    const room = userData.room

    // Clear typing status
    typingUsers.delete(socket.id)
    socket.to(room).emit("userStoppedTyping", socket.id)
  })

  // Handle private messages
  socket.on("privateMessage", ({ to, text }) => {
    const fromUser = activeUsers.get(socket.id)
    const toSocketId = Array.from(activeUsers.entries()).find(([_, userData]) => userData.username === to)?.[0]

    if (toSocketId && fromUser) {
      const privateMessage = {
        id: uuidv4(),
        text,
        sender: fromUser.username,
        receiver: to,
        timestamp: new Date(),
        isPrivate: true,
        character: fromUser.character,
      }

      // Send to recipient
      socket.to(toSocketId).emit("privateMessage", privateMessage)

      // Send back to sender
      socket.emit("privateMessage", privateMessage)
    }
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    const userData = activeUsers.get(socket.id)
    if (!userData) return

    console.log(`User disconnected: ${userData.username} (${socket.id})`)

    const room = userData.room

    // Send system message about user leaving
    const leaveMessage = {
      id: uuidv4(),
      text: `${userData.username} has left the chat`,
      sender: "system",
      timestamp: new Date(),
      room,
    }

    if (chatRooms.has(room)) {
      chatRooms.get(room).messages.push(leaveMessage)
    }

    io.to(room).emit("message", leaveMessage)

    // Remove user from active users
    activeUsers.delete(socket.id)

    // Clear typing indicator
    typingUsers.delete(socket.id)

    // Update user list for the room
    io.to(room).emit("userList", getActiveUsersInRoom(room))
  })
})

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})
