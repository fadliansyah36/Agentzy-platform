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
  title: 'Agentzy — Perusahaan Jasa Tenaga Kerja Sales & Teknisi Didukung Staf AI',
  description:
    'Agentzy adalah perusahaan penyedia dan pengelola tenaga kerja sales serta teknisi lapangan yang didukung oleh staf AI terkelola dalam satu sistem enterprise.',
  applicationName: 'Agentzy',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Agentzy',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Agentzy — Jasa Tenaga Kerja Sales & Teknisi Didukung Staf AI',
    description:
      'Perusahaan jasa tenaga kerja sales dan teknisi lapangan yang didukung oleh staf AI terkelola untuk enterprise.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentzy — Jasa Tenaga Kerja Sales & Teknisi Didukung Staf AI',
    description:
      'Perusahaan jasa tenaga kerja sales dan teknisi lapangan yang didukung oleh staf AI terkelola.',
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
