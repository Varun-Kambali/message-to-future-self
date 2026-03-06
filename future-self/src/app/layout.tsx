// src/app/layout.tsx
import type { Metadata } from 'next'
import { Playfair_Display, Lora, Special_Elite } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

const specialElite = Special_Elite({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-special-elite',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Future Self Messenger',
  description: 'A digital time capsule — send a letter, voice note, or video to your future self.',
  openGraph: {
    title: 'Future Self Messenger',
    description: 'Like writing a letter in a Tokyo café, sealed with wax, delivered a year later.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${lora.variable} ${specialElite.variable}`}>
      <body>{children}</body>
    </html>
  )
}
