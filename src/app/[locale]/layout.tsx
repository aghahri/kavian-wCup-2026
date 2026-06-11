import type { Metadata } from "next";
import { Vazirmatn, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { routing, isRtl, type Locale } from "@/i18n/routing";
import "../globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const rtl = isRtl(locale);
  const fontClass = locale === "en" ? inter.variable : vazirmatn.variable;

  return (
    <html lang={locale} dir={rtl ? "rtl" : "ltr"}>
      <body className={`${fontClass} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Header locale={locale as Locale} />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
            <Footer />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
