import "@/app/globals.css";
import { Analytics } from "@/components/analytics";
import { Chat } from "@/components/chat";
import Footer from "@/components/footer";
import { WebSiteJsonLd } from "@/components/json-ld";
import Navbar from "@/components/navbar";
import ApolloProvider from "@/components/providers/apollo";
import { IntlProvider } from "@/components/providers/intl";
import { ThemeProvider } from "@/components/providers/theme";
import { getLocalizedUrl, getOgImageUrl } from "@/lib/site-url";
import { getBaseURL } from "@/lib/utils";
import { locales } from "@/navigation";
import type { Metadata } from "next";
import { hasLocale, type AbstractIntlMessages } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: RootLayoutProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = hasLocale(locales, requestedLocale) ? requestedLocale : "en";
  const t = await getTranslations({ locale, namespace: "HomePage" });
  const baseUrl = getBaseURL();
  const canonicalUrl = getLocalizedUrl(locale, "/", baseUrl);
  const languages = Object.fromEntries(
    locales.map((candidate) => [
      candidate,
      getLocalizedUrl(candidate, "/", baseUrl),
    ]),
  );

  return {
    title: {
      default: t("title"),
      template: "%s | Abdul Hamid",
    },
    description: t("description"),
    metadataBase: new URL(baseUrl),
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: [
        {
          url: "/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    alternates: {
      canonical: canonicalUrl,
      languages,
      types: {
        "application/rss+xml": `${baseUrl}/rss.xml?locale=${locale}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Abdul Hamid",
      title: t("title"),
      description: t("description"),
      locale,
      url: canonicalUrl,
      images: [{ url: getOgImageUrl(t("title"), locale, baseUrl) }],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@abdulachik",
      title: t("title"),
      description: t("description"),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = (await import(`@/translations/${locale}.json`))
    .default as AbstractIntlMessages;
  const t = await getTranslations({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <WebSiteJsonLd
          description={t("HomePage.description")}
          locale={locale}
        />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} min-h-[100dvh] bg-background text-foreground antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg"
        >
          {t("Skip to main content")}
        </a>
        <ApolloProvider locale={locale}>
          <IntlProvider locale={locale} messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="flex min-h-[100dvh] flex-col">
                <Navbar />
                <main id="main-content" className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
              <Chat />
              <Analytics />
              <SpeedInsights />
            </ThemeProvider>
          </IntlProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
