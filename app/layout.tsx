import type { Metadata, Viewport } from 'next'
import './globals.css'

// הגדרות Viewport נפרדות (נדרש בגרסאות Next.js החדשות)
export const viewport: Viewport = {
  themeColor: '#001D3D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Saban Elite Fleet',
  description: 'מערכת ניהול צי ח.סבן - בקרת X-RAY',
  manifest: '/manifest.json', // קישור לקובץ המניפסט בתיקיית public
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png', // אייקון ייעודי לאייפון
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Saban Elite',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        {/* הוספת תגיות מטא נוספות לשיפור חוויית ה-PWA באייפון */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
