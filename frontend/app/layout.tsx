import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans" });
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Việt Phục Remix — Phối Cổ Phục Phong Cách Gen Z",
  description: "Khám phá và phối trang phục truyền thống Việt Nam theo sự kiện, phong cách đương đại và bảo chứng văn hóa AI.",
};

import { ClientProviders } from "@/components/client-providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
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
      <body className="min-h-screen flex flex-col font-sans antialiased selection:bg-[#9E2A2B] selection:text-white">
        <ClientProviders>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <footer className="border-t border-[#E7DFD3] dark:border-[#2E2A26] py-6 bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 text-xs text-[#78716C] dark:text-[#A8A29E]">
            <div className="max-w-7xl mx-auto px-6 flex justify-end">
              <p className="font-serif italic text-xs text-[#78716C] dark:text-[#A8A29E]">from Sonion team with love</p>
            </div>
          </footer>
        </ClientProviders>
      </body>
    </html>
  );
}
