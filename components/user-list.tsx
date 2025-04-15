"use client"

import { Badge } from "@/components/ui/badge"
import MarioAvatar from "./mario-avatar"

interface User {
  id: string
  username: string
  character: "mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi"
}

interface UserListProps {
  users: User[]
  currentUser: string
  onPrivateChat: (username: string) => void
  unreadMessages: Record<string, number>
}

export default function UserList({ users, currentUser, onPrivateChat, unreadMessages }: UserListProps) {
  return (
    <div className="p-2">
      <h3 className="font-mario text-xs text-mario-black mb-3 text-center">Online Users ({users.length})</h3>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className={`flex items-center justify-between p-2 rounded-lg border-2 border-mario-black ${
              user.username === currentUser ? "bg-mario-green/20" : "bg-white hover:bg-mario-yellow/20 cursor-pointer"
            }`}
            onClick={() => {
              if (user.username !== currentUser) {
                onPrivateChat(user.username)
              }
            }}
          >
            <div className="flex items-center">
              <MarioAvatar character={user.character} size="sm" />
              <span className="ml-2 text-xs font-mario">
                {user.username === currentUser ? `${user.username} (You)` : user.username}
              </span>
            </div>
            {unreadMessages[user.username] > 0 && (
              <Badge variant="destructive" className="text-[8px]">
                {unreadMessages[user.username]}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
