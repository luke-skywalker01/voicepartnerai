import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientProviders from '@/components/providers/ClientProviders'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'VoicePartnerAI - Deutsche Voice AI Plattform',
  description: 'Die führende Voice AI Plattform für den deutschen Markt. Erstellen Sie intelligente Sprachbots für Ihr Unternehmen.',
  metadataBase: new URL('https://voicepartnerai.com'),
  keywords: ['Voice AI', 'Sprachassistent', 'KI', 'Deutschland', 'Automation'],
  authors: [{ name: 'VoicePartnerAI Team' }],
  creator: 'VoicePartnerAI',
  publisher: 'VoicePartnerAI GmbH',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'verification-token',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}