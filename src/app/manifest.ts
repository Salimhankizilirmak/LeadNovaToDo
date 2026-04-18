import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LeadNova System',
    short_name: 'LeadNova',
    description: 'Güçlü ve güvenli lead yönetim platformu',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9FAFB',
    theme_color: '#6366F1',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
