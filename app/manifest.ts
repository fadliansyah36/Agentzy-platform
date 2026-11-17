import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Agentzy — Human & AI Workforce',
    short_name: 'Agentzy',
    description:
      'One Platform to Manage Human & AI Workforce. Portal kerja Sales Resmi, Affiliate Freelance, dan Teknisi Lapangan.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F5F8FA',
    theme_color: '#17324D',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
