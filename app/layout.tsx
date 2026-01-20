import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Saban Elite Fleet',
  description: 'מערכת ניהול צי ח.סבן',
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
