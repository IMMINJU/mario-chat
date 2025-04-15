"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface Room {
  id: string
  name: string
  userCount: number
}

interface RoomSelectorProps {
  rooms: Room[]
  currentRoom: string
  onRoomChange: (roomId: string) => void
}

export default function RoomSelector({ rooms, currentRoom, onRoomChange }: RoomSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="mario-button bg-mario-yellow hover:bg-mario-yellow/90 h-7">
          <span className="font-mario text-[8px] text-mario-black mr-1">Change Room</span>
          <ChevronDown className="h-3 w-3 text-mario-black" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {rooms.map((room) => (
          <DropdownMenuItem
            key={room.id}
            onClick={() => onRoomChange(room.id)}
            className={currentRoom === room.id ? "bg-mario-green/20" : ""}
          >
            <span className="font-mario text-[10px]">
              {room.name} ({room.userCount})
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
