import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import ImagePreloader from "@/components/image-preloader"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Super Mario Chat",
  description: "Super Mario themed chat service using Socket.IO",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        {/* 캐릭터 이미지 preload */}
        <link rel="preload" href="/mario-avatar.png" as="image" />
        <link rel="preload" href="/luigi-avatar.png" as="image" />
        <link rel="preload" href="/toad-avatar.png" as="image" />
        <link rel="preload" href="/peach-avatar.png" as="image" />
        <link rel="preload" href="/bowser-avatar.png" as="image" />
        <link rel="preload" href="/yoshi-avatar.png" as="image" />
        <link rel="preload" href="/question-block.png" as="image" />
        <link rel="preload" href="/coin.mp3" as="audio" />
      </head>
      <body className={inter.className}>
        <Providers>
          <ImagePreloader />
          {children}
        </Providers>
      </body>
    </html>
  )
}


import './globals.css'