import type { Config } from 'tailwindcss';

/**
 * NOT: Bu proje Tailwind CSS v4 kullanmaktadır.
 * v4'te renk paleti ve tema değişkenleri `src/app/globals.css` içindeki
 * `@theme` bloğu aracılığıyla tanımlanmaktadır.
 * Bu dosya yalnızca referans ve geçmiş uyumluluk için tutulmaktadır.
 *
 * LeadNova Renk Paleti:
 *   primary:    #6366F1
 *   accent:     #10B981
 *   danger:     #EF4444
 *   background: #F9FAFB
 *   card:       #FFFFFF
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        accent: '#10B981',
        danger: '#EF4444',
        background: '#F9FAFB',
        card: '#FFFFFF',
      },
    },
  },
  plugins: [],
};

export default config;
