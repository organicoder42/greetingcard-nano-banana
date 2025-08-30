import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Greetingsmith - AI-Powered Greeting Cards',
  description: 'Create personalized greeting cards for any occasion using AI. Choose your style, add photos, and get print-ready PDFs instantly.',
  keywords: 'greeting cards, AI, personalized, occasions, birthday, anniversary, print-ready',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}