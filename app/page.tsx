import ChatInterface from "@/components/chat-interface"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center">실시간 채팅</h1>
        <ChatInterface />
      </div>
    </main>
  )
}
