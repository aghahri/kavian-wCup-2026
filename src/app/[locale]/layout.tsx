import type { Metadata } from "next";
import { Vazirmatn, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { CurrentUserProvider } from "@/contexts/CurrentUserProvider";
import { getCurrentUser } from "@/lib/auth";
import { toClientUser } from "@/lib/current-user";
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "KavianFootball",
    },
    icons: {
      icon: "/icons/icon-192.png",
      apple: "/icons/icon-512.png",
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const serverUser = await getCurrentUser();
  const initialUser = serverUser ? toClientUser(serverUser) : null;
  const rtl = isRtl(locale);
  const fontClass = locale === "en" ? inter.variable : vazirmatn.variable;

  return (
    <html lang={locale} dir={rtl ? "rtl" : "ltr"}>
      <body className={`${fontClass} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <CurrentUserProvider initialUser={initialUser}>
            <ServiceWorkerRegister />
            <div className="flex min-h-screen flex-col">
              <Header locale={locale as Locale} />
              <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
              <Footer locale={locale as Locale} />
            </div>
          </CurrentUserProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
