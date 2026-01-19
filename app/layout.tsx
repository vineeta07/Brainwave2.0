"use client"

import './globals.css'
import ChatBot from '../ChatBot' // adjust path as needed

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ChatBot />
      </body>
    </html>
  )
}
