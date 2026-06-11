import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "کاویان | پیش‌بینی جام جهانی ۲۰۲۶",
  description: "سایت پیش‌بینی بازی‌های جام جهانی ۲۰۲۶ برای کاویان و دوستانش",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.variable} font-sans antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
