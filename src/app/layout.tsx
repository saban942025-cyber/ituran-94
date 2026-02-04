import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ח. סבן - מערכת לוגיסטית',
  description: 'ניהול תעודות משלוח חכם',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
