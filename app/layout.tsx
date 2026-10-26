import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/manrope';
import '@fontsource-variable/space-grotesk';
import './globals.css';
import { StyledComponentsRegistry } from '@/components/providers/StyledComponentsRegistry';
import { Providers } from '@/components/providers/Providers';

export const metadata: Metadata = {
  title: {
    default: 'Highway Rush — Endless Drive',
    template: '%s · Highway Rush',
  },
  description:
    'A premium 3D endless highway racer. Thread traffic, chain near misses, fire nitro and chase records across eight distinct destinations. Built by Umar Nazir.',
  applicationName: 'Highway Rush',
  authors: [{ name: 'Umar Nazir' }],
  creator: 'Umar Nazir',
  keywords: [
    'Highway Rush',
    '3D racing game',
    'endless racer',
    'browser racing game',
    'Three.js',
    'Next.js game',
  ],
  openGraph: {
    title: 'Highway Rush — Endless Drive',
    description:
      'Eight routes. Fourteen machines. One endless stretch of asphalt. A premium browser racing game built by Umar Nazir.',
    type: 'website',
  },
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#07090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <Providers>{children}</Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
