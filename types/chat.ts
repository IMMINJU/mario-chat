export type MarioCharacter = "mario" | "luigi" | "toad" | "peach" | "bowser" | "yoshi"

export interface Message {
  id: string
  text: string
  sender: string
  timestamp: Date
  character?: MarioCharacter
  isSystem?: boolean
}

export interface User {
  id: string
  username: string
  character: MarioCharacter
  isOnline: boolean
}

export interface ChatState {
  messages: Message[]
  users: User[]
  isConnected: boolean
  isTyping: Record<string, boolean>
}
