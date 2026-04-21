import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LeadNova Endüstriyel Yönetim Platformu',
    short_name: 'LeadNova',
    description: 'Yapay zeka destekli, güvenli ve kurumsal dijital ikiz görev yönetim sistemi',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#4F46E5',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '16x16 32x32 64x64',
        type: 'image/x-icon',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
  };
}
