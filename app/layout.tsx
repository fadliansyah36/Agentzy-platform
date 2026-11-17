import type { Metadata, Viewport } from 'next';
import './globals.css';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceProvider';
import {
  OfflineIndicator,
  ServiceWorkerRegister,
} from '@/components/pwa/PWAControls';

export const viewport: Viewport = {
  themeColor: '#17324D',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Agent-zy — Smarter Workforce, Powered by Human & AI',
  description:
    'Menyediakan jasa dan tenaga kerja dengan support teknologi dan Artificial Intelligence — Staff Sales, jaringan Affiliate, dan Teknisi Lapangan terkelola.',
  applicationName: 'Agent-zy',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Agent-zy',
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Agent-zy — Smarter Workforce, Powered by Human & AI',
    description:
      'Menyediakan jasa dan tenaga kerja dengan support teknologi dan Artificial Intelligence untuk pertumbuhan bisnis & operasional.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agent-zy — Smarter Workforce, Powered by Human & AI',
    description:
      'Menyediakan jasa dan tenaga kerja dengan support teknologi dan Artificial Intelligence.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#F5F8FA] text-[#172B3A]"
      >
        <WorkspaceProvider>
          <ServiceWorkerRegister />
          {children}
          <OfflineIndicator />
        </WorkspaceProvider>
      </body>
    </html>
  );
}
