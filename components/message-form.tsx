"use client"

import { useForm } from "react-hook-form"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface MessageFormProps {
  onSendMessage: (message: string) => void
  onTypingStart: () => void
  onTypingStop: () => void
  isConnected: boolean
}

interface FormValues {
  message: string
}

export default function MessageForm({ onSendMessage, onTypingStart, onTypingStop, isConnected }: MessageFormProps) {
  const { register, handleSubmit, reset, watch } = useForm<FormValues>()
  const messageValue = watch("message")

  // Handle typing indicator
  useEffect(() => {
    const typingTimer = setTimeout(() => {
      if (messageValue?.trim()) {
        onTypingStart()
      } else {
        onTypingStop()
      }
    }, 300)

    return () => clearTimeout(typingTimer)
  }, [messageValue, onTypingStart, onTypingStop])

  const onSubmit = (data: FormValues) => {
    if (data.message.trim()) {
      onSendMessage(data.message)
      reset()
      onTypingStop()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full gap-2">
      <div className="pipe flex-1 relative">
        <div className="pipe-top"></div>
        <Input
          {...register("message")}
          placeholder="Type your message..."
          className="border-none bg-transparent text-white placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={!isConnected}
          aria-label="Message input"
        />
      </div>
      <Button
        type="submit"
        className="mario-button bg-mario-red hover:bg-mario-red/90 text-white"
        disabled={!isConnected || !messageValue?.trim()}
        aria-label="Send message"
      >
        <Send className="h-4 w-4 mr-2" />
        Send
      </Button>
    </form>
  )
}
