import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tournament Madness',
  description: '64-Team Interactive Bracket',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
