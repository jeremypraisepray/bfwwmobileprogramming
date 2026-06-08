import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Yardskapes — Premium Houston Landscaping',
  description:
    'Yardskapes designs, builds, and maintains premium estate landscapes across greater Houston. Inspired by nature, perfected by us.',
  keywords: [
    'Houston landscaping',
    'estate landscaping',
    'landscape design',
    'hardscapes',
    'native planting',
    'smart irrigation',
    'landscape lighting',
  ],
  openGraph: {
    title: 'Yardskapes — Premium Houston Landscaping',
    description:
      'Premium landscaping & outdoor living across greater Houston. Designed, built, and maintained by one in-house team.',
    type: 'website',
    images: ['/images/hero.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#204028',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
