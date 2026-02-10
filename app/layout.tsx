import type { Metadata } from "next";
import localFont from "next/font/local";

import Notification from "./(components)/Notification";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Lynchpin Global",
  description: "A financial management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            // Remove browser extension attributes that cause hydration issues
            (function() {
              const attributesToRemove = [
                'cz-shortcut-listen',
                'data-new-gr-c-s-check-loaded',
                'data-gr-ext-installed'
              ];
              
              attributesToRemove.forEach(attr => {
                if (document.body && document.body.hasAttribute && document.body.hasAttribute(attr)) {
                  document.body.removeAttribute(attr);
                }
              });
            })();
          `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>{children}</Providers>
        <Notification />
      </body>
    </html>
  );
}
