import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Saban Elite Fleet AI',
  description: 'ניהול צי רכב ח.סבן',
  manifest: '/manifest.json'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta name="theme-color" content="#0046ad" />
      </head>
      <body>{children}</body>
    </html>
  )
}
