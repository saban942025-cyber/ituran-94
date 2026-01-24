import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#001D3D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // חשוב לאייפונים עם "נוץ'"
}

export const metadata: Metadata = {
  title: 'Saban Elite Fleet',
  description: 'מערכת ניהול צי ח.סבן - בקרת X-RAY',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Saban Elite',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png', // אייקון חובה לאייפון
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        {/* הגדרות קריטיות לאפל (iOS) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased overflow-x-hidden selection:bg-blue-100">
        {children}
      </body>
    </html>
  )
}
