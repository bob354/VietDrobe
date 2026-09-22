import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "VietDrobe — Cổ phục Việt để khám phá, phối và thuê",
  description: "Khám phá cổ phục Việt, tạo bản phối của riêng bạn và đặt thuê trang phục cho dịp đặc biệt.",
};

import { ClientProviders } from "@/components/client-providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                if (t === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <ClientProviders>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <footer className="site-footer"><div className="shell footer-inner">From Sonion team with love</div></footer>
        </ClientProviders>
      </body>
    </html>
  );
}
