import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { AuthProvider } from '@/lib/useAuth';
import RegisterSW from '@/components/RegisterSW';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display'
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  title: 'MBOA LIVE — Le Cameroun en temps réel',
  description:
    "MBOA LIVE : voyez et partagez ce qui se passe autour de vous, en temps réel, à Douala et Yaoundé.",
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MBOA LIVE'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B1210'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg text-ink font-body pb-20 md:pb-0">
        <AuthProvider>
          <RegisterSW />
          <Header />
          <main>{children}</main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
