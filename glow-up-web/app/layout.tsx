'use client';

import Script from 'next/script';
import { I18nProvider } from '@/lib/i18n-provider';
import { Toaster } from '@/components/ui/sonner';
import '@/styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <title>The Glow Hub</title>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="application-name" content="The Glow Hub" />
        <Script
          defer
          src="https://tools.theglowhub.com.sa/script.js"
          data-website-id="9feca114-f28e-40da-af1d-464ed22c55d7"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
