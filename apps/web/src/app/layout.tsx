import type { Metadata } from 'next';
import { RootLayoutClient } from '@/components/root-layout-client';
import './globals.css';

export const metadata: Metadata = {
  title: 'Radio Hit 90 y 2000',
  description: 'Los exitos que marcaron tu vida',
  icons: {
    icon: '/logo-home.jpeg',
    shortcut: '/logo-home.jpeg',
    apple: '/logo-home.jpeg'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
