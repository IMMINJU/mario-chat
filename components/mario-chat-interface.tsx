"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Users, MessageSquare, Menu } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import MarioAvatar from "./mario-avatar"
import MarioUsername from "./mario-username"
import UserList from "./user-list"
import RoomSelector from "./room-selector"
import { useLocalStorage } from "@/hooks/use-local-storage"

// Message type definition
interface Message {
  id: string
  text: string
  sender: string
  receiver?: string
  timestamp: Date
  character?: "mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi"
  isPrivate?: boolean
  room?: string
}

// User type definition
interface User {
  id: string
  username: string
  character: "mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi"
}

// Form input type definition
interface FormInput {
  message: string
}

// Room type definition
interface Room {
  id: string
  name: string
  userCount: number
}

export default function MarioChatInterface() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [privateMessages, setPrivateMessages] = useState<Message[]>([])
  const [username, setUsername] = useState<string>("")
  const [character, setCharacter] = useState<"mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi">("mario")
  const [showUsernameForm, setShowUsernameForm] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [currentRoom, setCurrentRoom] = useState<string>("general")
  const [rooms, setRooms] = useState<Room[]>([])
  const [privateChat, setPrivateChat] = useState<string | null>(null)
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({})
  const [showUserList, setShowUserList] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [coinSound] = useState(() => (typeof Audio !== "undefined" ? new Audio("/coin.mp3") : null))

  // Use localStorage to persist username and character
  const [savedUser, setSavedUser] = useLocalStorage<{ username: string; character: string } | null>(
    "mario-chat-user",
    null,
  )

  // react-hook-form setup
  const { register, handleSubmit, reset, watch } = useForm<FormInput>()
  const messageValue = watch("message", "")

  // Username and character selection form
  const { register: registerUsername, handleSubmit: handleSubmitUsername } = useForm<{
    username: string
    character: "mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi"
    room: string
  }>({
    defaultValues: {
      username: savedUser?.username || "",
      character: (savedUser?.character as any) || "mario",
      room: "general",
    },
  })

  // Handle typing indicator
  useEffect(() => {
    if (!socket || !messageValue.trim()) return

    // Send typing event
    socket.emit("typing")

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stoppedTyping")
    }, 1000)

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [messageValue, socket])

  // Socket connection setup
  useEffect(() => {
    if (showUsernameForm) return

    // Socket connection
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001"
    const newSocket = io(socketServerUrl, {
      query: {
        username,
        character,
        room: currentRoom,
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    setSocket(newSocket)

    // Message event listener
    newSocket.on("message", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message])
      if (coinSound && message.sender !== "system") {
        coinSound.currentTime = 0
        coinSound.play().catch((e) => console.log("Audio playback failed:", e))
      }
    })

    // Private message event listener
    newSocket.on("privateMessage", (message: Message) => {
      setPrivateMessages((prevMessages) => [...prevMessages, message])

      // Update unread count if not in private chat with this user
      if (privateChat !== message.sender && privateChat !== message.receiver) {
        const otherUser = message.sender === username ? message.receiver : message.sender
        if (otherUser) {
          setUnreadMessages((prev) => ({
            ...prev,
            [otherUser]: (prev[otherUser] || 0) + 1,
          }))
        }
      }

      if (coinSound) {
        coinSound.currentTime = 0
        coinSound.play().catch((e) => console.log("Audio playback failed:", e))
      }
    })

    // Room history event listener
    newSocket.on("roomHistory", (roomMessages: Message[]) => {
      setMessages(roomMessages)
    })

    // User list event listener
    newSocket.on("userList", (userList: User[]) => {
      setUsers(userList)
    })

    // Typing indicator event listeners
    newSocket.on("userTyping", ({ username }: { username: string }) => {
      setTypingUsers((prev) => [...prev, username])
    })

    newSocket.on("userStoppedTyping", (userId: string) => {
      setTypingUsers((prev) => prev.filter((id) => id !== userId))
    })

    // Fetch available rooms
    fetch(`${socketServerUrl}/api/rooms`)
      .then((res) => res.json())
      .then((data) => setRooms(data))
      .catch((err) => console.error("Failed to fetch rooms:", err))

    // Component unmount - disconnect socket
    return () => {
      newSocket.disconnect()
    }
  }, [showUsernameForm, username, character, currentRoom, coinSound, privateChat])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, privateMessages, privateChat])

  // Message submission function
  const onSubmit = (data: FormInput) => {
    if (!socket || !data.message.trim()) return

    if (privateChat) {
      // Send private message
      socket.emit("privateMessage", {
        to: privateChat,
        text: data.message,
      })
    } else {
      // Send regular message
      const newMessage: Omit<Message, "id"> = {
        text: data.message,
        sender: username,
        timestamp: new Date(),
        character,
        room: currentRoom,
      }

      socket.emit("sendMessage", newMessage)
    }

    reset() // Reset form
  }

  // Username submission
  const onUsernameSubmit = (data: {
    username: string
    character: "mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi"
    room: string
  }) => {
    setUsername(data.username)
    setCharacter(data.character)
    setCurrentRoom(data.room)
    setShowUsernameForm(false)

    // Save to localStorage
    setSavedUser({
      username: data.username,
      character: data.character,
    })
  }

  // Change room
  const handleRoomChange = (roomId: string) => {
    if (!socket) return

    setPrivateChat(null)
    setCurrentRoom(roomId)
    socket.emit("joinRoom", roomId)
  }

  // Start private chat
  const handlePrivateChat = (targetUser: string) => {
    setPrivateChat(targetUser)

    // Clear unread count
    setUnreadMessages((prev) => ({
      ...prev,
      [targetUser]: 0,
    }))
  }

  // Logout
  const handleLogout = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
    }
    setShowUsernameForm(true)
    setMessages([])
    setPrivateMessages([])
    setUsers([])
    setTypingUsers([])
    setPrivateChat(null)
    setUnreadMessages({})
  }

  // Filter private messages for current chat
  const currentPrivateMessages = privateMessages.filter(
    (msg) =>
      (msg.sender === privateChat && msg.receiver === username) ||
      (msg.sender === username && msg.receiver === privateChat),
  )

  if (showUsernameForm) {
    return (
      <Card className="mario-card bg-mario-beige pixel-corners">
        <CardHeader className="bg-mario-red text-white font-mario text-center text-sm md:text-base">
          Select Character
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmitUsername(onUsernameSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="font-mario text-xs md:text-sm text-mario-black">Nickname</label>
              <Input
                {...registerUsername("username", { required: true })}
                className="border-mario-black border-2 font-mario text-xs"
                placeholder="Enter your nickname"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mario text-xs md:text-sm text-mario-black">Character</label>
              <div className="grid grid-cols-3 gap-2">
                {["mario", "luigi", "toad", "peach", "bowser", "yoshi"].map((char) => (
                  <label key={char} className="cursor-pointer">
                    <input
                      type="radio"
                      value={char}
                      {...registerUsername("character")}
                      className="sr-only"
                      onChange={() => setCharacter(char as any)}
                    />
                    <div
                      className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                        char === character ? "bg-mario-blue text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <MarioAvatar character={char as any} size="lg" />
                      <span className="mt-2 font-mario text-[10px] capitalize">{char}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mario text-xs md:text-sm text-mario-black">Room</label>
              <select
                {...registerUsername("room")}
                className="w-full border-mario-black border-2 rounded p-2 font-mario text-xs"
              >
                <option value="general">General</option>
                <option value="mushroom-kingdom">Mushroom Kingdom</option>
                <option value="bowser-castle">Bowser's Castle</option>
              </select>
            </div>

            <Button
              type="submit"
              className="w-full mario-button bg-mario-green hover:bg-mario-green/90 text-white font-mario text-xs"
            >
              Start Game!
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mario-card bg-mario-beige pixel-corners">
      <CardHeader className="flex flex-row items-center justify-between bg-mario-red p-4">
        <div className="flex items-center">
          <div className="question-block mr-3"></div>
          <h2 className="font-mario text-white text-xs md:text-sm">
            {privateChat
              ? `Chat with ${privateChat}`
              : `Room: ${rooms.find((r) => r.id === currentRoom)?.name || currentRoom}`}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowUserList(!showUserList)}
            variant="outline"
            size="icon"
            className="mario-button bg-mario-yellow hover:bg-mario-yellow/90 h-8 w-8"
          >
            <Users className="h-4 w-4 text-mario-black" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="mario-button bg-mario-yellow hover:bg-mario-yellow/90 h-8 w-8"
              >
                <Menu className="h-4 w-4 text-mario-black" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-mario-blue p-2 border-y-2 border-mario-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="coin"></div>
              <span className="font-mario text-white text-xs">
                {username} ({character})
              </span>
            </div>
            {!privateChat && <RoomSelector rooms={rooms} currentRoom={currentRoom} onRoomChange={handleRoomChange} />}
          </div>
        </div>

        <div className="flex h-[400px]">
          {showUserList && (
            <div className="w-1/4 border-r-2 border-mario-black">
              <UserList
                users={users}
                currentUser={username}
                onPrivateChat={handlePrivateChat}
                unreadMessages={unreadMessages}
              />
            </div>
          )}

          <div className={`${showUserList ? "w-3/4" : "w-full"}`}>
            <Tabs defaultValue="public" className="w-full">
              <TabsList className="bg-mario-blue w-full">
                <TabsTrigger
                  value="public"
                  className="data-[state=active]:bg-mario-red data-[state=active]:text-white"
                  onClick={() => setPrivateChat(null)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Public Chat
                </TabsTrigger>

                {Object.entries(unreadMessages).map(
                  ([user, count]) =>
                    count > 0 && (
                      <TabsTrigger
                        key={user}
                        value={user}
                        className="data-[state=active]:bg-mario-green data-[state=active]:text-white"
                        onClick={() => handlePrivateChat(user)}
                      >
                        {user}
                        <Badge variant="destructive" className="ml-2">
                          {count}
                        </Badge>
                      </TabsTrigger>
                    ),
                )}
              </TabsList>

              <TabsContent value="public" className="m-0">
                <ScrollArea className="h-[350px] p-4">
                  {messages.map((message, index) => (
                    <div key={message.id || index} className="mb-4">
                      {message.sender === "system" ? (
                        <div className="bg-mario-yellow/70 text-mario-black p-2 rounded font-mario text-xs text-center my-2 border-2 border-mario-black">
                          {message.text}
                        </div>
                      ) : (
                        <div className={`flex ${message.sender === username ? "flex-row-reverse" : "flex-row"}`}>
                          <MarioAvatar character={message.character || "mario"} />
                          <div
                            className={`max-w-[80%] mx-2 ${message.sender === username ? "text-right" : "text-left"}`}
                          >
                            <MarioUsername username={message.sender} isCurrentUser={message.sender === username} />
                            <div
                              className={`p-3 rounded-lg border-2 border-mario-black ${
                                message.sender === username ? "bg-mario-green text-white" : "bg-white text-mario-black"
                              }`}
                            >
                              <p className="text-sm">{message.text}</p>
                            </div>
                            <div className="text-xs text-mario-black/70 mt-1 font-mario text-[8px]">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {typingUsers.length > 0 && (
                    <div className="bg-mario-yellow/30 text-mario-black p-2 rounded font-mario text-xs text-center my-2">
                      {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </TabsContent>

              {privateChat && (
                <TabsContent value={privateChat} className="m-0">
                  <ScrollArea className="h-[350px] p-4">
                    {currentPrivateMessages.map((message, index) => (
                      <div key={message.id || index} className="mb-4">
                        <div className={`flex ${message.sender === username ? "flex-row-reverse" : "flex-row"}`}>
                          <MarioAvatar character={message.character || "mario"} />
                          <div
                            className={`max-w-[80%] mx-2 ${message.sender === username ? "text-right" : "text-left"}`}
                          >
                            <MarioUsername username={message.sender} isCurrentUser={message.sender === username} />
                            <div
                              className={`p-3 rounded-lg border-2 border-mario-black ${
                                message.sender === username ? "bg-mario-green text-white" : "bg-white text-mario-black"
                              }`}
                            >
                              <p className="text-sm">{message.text}</p>
                            </div>
                            <div className="text-xs text-mario-black/70 mt-1 font-mario text-[8px]">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </ScrollArea>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t-2 border-mario-black p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full gap-2">
          <div className="pipe flex-1 relative">
            <div className="pipe-top"></div>
            <Input
              {...register("message", { required: true })}
              placeholder="Type your message..."
              className="border-none bg-transparent text-white placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button type="submit" className="mario-button bg-mario-red hover:bg-mario-red/90 text-white">
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
