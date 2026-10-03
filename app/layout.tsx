import type { Metadata } from "next";
import "./globals.css";
import "./cinema-entry.css";
import "./cinema-performance.css";
import "./experience-selection.css";
import "./editorial-type.css";
import {zereca,zerecaStructuredData} from '@/components/zereca-brand';

export const metadata: Metadata = {
  metadataBase:new URL(zereca.origin),
  title:zereca.title,
  description:zereca.description,
  alternates:{canonical:'/'},
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title:zereca.title,
    description:zereca.description,
    url:zereca.origin,
    siteName: "Zereca",
    type: "website",
    locale: "en_CA",
    images:[{url:'/assets/book/book-poster.webp',width:1278,height:720,alt:'The Zereca book: a doorway into software, stories and music.'}],
  },
  twitter: {
    card: "summary_large_image",
    title:zereca.title,
    description:zereca.description,
    images:['/assets/book/book-poster.webp'],
  },
  // Owner review stays private; crawling is enabled at the public domain launch.
  robots:{index:process.env.ZERECA_PUBLIC_SITE==='true',follow:process.env.ZERECA_PUBLIC_SITE==='true'},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(zerecaStructuredData).replace(/</g,'\\u003c')}}/>
        <link rel="preload" href="/fonts/zereca-display-normal.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/zereca-display-italic.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/zereca-label.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/zereca-condensed.woff" as="font" type="font/woff" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
