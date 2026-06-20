import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SchoolBridge — Digital Communication for Nigerian Schools',
    template: '%s | SchoolBridge',
  },
  description:
    'Replace the paper communication booklet with SchoolBridge — instant parent-teacher messaging, homework tracking, attendance, results, and fee reminders. Built for Nigerian schools.',
  keywords: [
    'school management',
    'parent teacher communication',
    'Nigerian schools',
    'school portal',
    'digital booklet',
  ],
  metadataBase: new URL('https://schoolbridge.ng'),
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://schoolbridge.ng',
    siteName: 'SchoolBridge',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
