import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GharKeChore · Kaam karo, kaamchori nahi.',
  description: 'A calm, shared space for family chores, meals and the week ahead.',
  generator: 'v0.app',
  applicationName: 'GharKeChore',
  appleWebApp: {
    capable: true,
    title: 'GharKeChore',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [{ url: '/gharke-chore-brand.png', type: 'image/png' }],
    shortcut: ['/gharke-chore-brand.png'],
    apple: '/gharke-chore-brand.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="min-w-0 w-full overflow-x-hidden bg-background text-foreground antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { const match = document.cookie.match(/(?:^|; )gharke-theme=([^;]+)/); const theme = match ? decodeURIComponent(match[1]) : 'system'; const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.classList.remove('dark', 'light'); document.documentElement.classList.add(dark ? 'dark' : 'light'); })()`,
          }}
        />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
