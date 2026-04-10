import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { LandscapeGuard } from '@/components/ui/LandscapeGuard';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Phi — Your Digital Bookshelf',
  description: 'Transform reading into an aesthetic, collectible experience.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Phi',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1A1612', // PHI_DARK.bgCanvas — warm very-dark
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="bg-canvas text-text-primary font-sans antialiased">
        <LandscapeGuard>{children}</LandscapeGuard>
      </body>
    </html>
  );
}