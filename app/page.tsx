import MarioChatInterface from "@/components/mario-chat-interface"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-mario text-white text-center mb-8 drop-shadow-[2px_2px_0_#000]">
          Super Mario Chat
        </h1>
        <MarioChatInterface />
      </div>
    </main>
  )
}
