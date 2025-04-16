"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConnectionStatusProps {
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  countdown: {
    seconds: number
    formattedTime: string
    isActive: boolean
  }
  onReconnect: () => void
}

export default function ConnectionStatus({
  isConnected,
  isConnecting,
  connectionError,
  countdown,
  onReconnect,
}: ConnectionStatusProps) {
  return (
    <div className="bg-mario-blue p-2 border-y-2 border-mario-black">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              isConnected ? "bg-green-500" : isConnecting ? "bg-yellow-500" : "bg-red-500"
            }`}
            aria-hidden="true"
          />
          <span className="font-mario text-white text-xs">
            {isConnected
              ? "Connected"
              : isConnecting
                ? `Connecting... ${countdown.isActive ? countdown.formattedTime : ""}`
                : "Disconnected"}
          </span>
        </div>

        {connectionError && (
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-mario-yellow mr-1" />
            <span className="text-mario-yellow text-xs font-mario">{connectionError}</span>
            <Button
              onClick={onReconnect}
              variant="outline"
              size="sm"
              className="ml-2 mario-button bg-mario-yellow hover:bg-mario-yellow/90 text-mario-black text-xs py-0 px-2 h-6"
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
