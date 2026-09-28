import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/siteConfig";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sr-travels.vercel.app"),
  title: `${siteConfig.businessName} - ${siteConfig.serviceRegion} Taxi & Car Rental`,
  description: `${siteConfig.businessName} outstation & local taxi booking service in ${siteConfig.serviceRegion}. One-way, round-trip & self-drive cars at transparent per-km rates.`,
  keywords: [
    siteConfig.businessName,
    "Taxi Booking Tamil Nadu",
    "Outstation Taxi Chennai",
    "One Way Cab Tamil Nadu",
    "Self Drive Rental",
    "Innova Crysta Booking",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: `${siteConfig.businessName} - ${siteConfig.serviceRegion} Taxi & Car Rental`,
    description: `Book outstation cabs and self-drive cars across ${siteConfig.serviceRegion} instantly. Transparent fares, 24/7 support.`,
    siteName: siteConfig.businessName,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.businessName} Taxi Booking`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.businessName} - ${siteConfig.serviceRegion} Taxi Booking`,
    description: `Outstation & local taxi booking service in ${siteConfig.serviceRegion}.`,
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.businessName,
  },
};

export const viewport: Viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10B981" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="h-full w-full overflow-hidden bg-slate-900 text-slate-800 select-none">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) {
                      console.log('ServiceWorker active: ', reg.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker error: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
