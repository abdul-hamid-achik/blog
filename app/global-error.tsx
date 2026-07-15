"use client";

import { useSyncExternalStore } from "react";

const copy = {
  en: {
    eyebrow: "Archive error",
    title: "Something interrupted the site",
    description: "The archive could not finish loading. Please try again.",
    retry: "Try again",
  },
  es: {
    eyebrow: "Error del archivo",
    title: "Algo interrumpió el sitio",
    description: "El archivo no pudo terminar de cargar. Inténtalo de nuevo.",
    retry: "Intentar de nuevo",
  },
  ru: {
    eyebrow: "Ошибка архива",
    title: "Работа сайта была прервана",
    description: "Архив не удалось загрузить. Попробуйте ещё раз.",
    retry: "Попробовать снова",
  },
} as const;

type ErrorLocale = keyof typeof copy;

const subscribe = () => () => undefined;
const getServerLocale = (): ErrorLocale => "en";

function getBrowserLocale(): ErrorLocale {
  if (typeof window === "undefined") return "en";
  const candidate = window.location.pathname.split("/").filter(Boolean)[0];
  return candidate === "es" || candidate === "ru" ? candidate : "en";
}

export default function GlobalError({ reset }: { reset: () => void }) {
  const locale = useSyncExternalStore(
    subscribe,
    getBrowserLocale,
    getServerLocale,
  );
  const t = copy[locale];

  return (
    <html lang={locale}>
      <body
        style={{
          margin: 0,
          color: "#20211f",
          background: "#f3f0e8",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <main
          style={{
            boxSizing: "border-box",
            display: "grid",
            minHeight: "100dvh",
            placeItems: "center",
            padding: "2rem",
          }}
        >
          <section
            style={{
              width: "min(100%, 42rem)",
              borderBlock: "1px solid #d4cebf",
              padding: "3rem 0",
            }}
          >
            <p
              style={{
                margin: "0 0 1.5rem",
                color: "#9c3f25",
                fontFamily: "ui-monospace, monospace",
                fontSize: ".7rem",
                fontWeight: 700,
                letterSpacing: ".14em",
                textTransform: "uppercase",
              }}
            >
              {t.eyebrow} / 500
            </p>
            <h1
              style={{
                margin: 0,
                maxWidth: "14ch",
                fontSize: "clamp(2.25rem, 8vw, 4.5rem)",
                letterSpacing: "-.055em",
                lineHeight: 1,
              }}
            >
              {t.title}
            </h1>
            <p
              style={{
                margin: "1.5rem 0 0",
                maxWidth: "36rem",
                color: "#65655e",
                fontSize: "1.05rem",
                lineHeight: 1.65,
              }}
            >
              {t.description}
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "2rem",
                minHeight: "2.75rem",
                border: 0,
                padding: ".75rem 1.1rem",
                color: "#f3f0e8",
                background: "#20211f",
                cursor: "pointer",
                font: "inherit",
                fontSize: ".875rem",
                fontWeight: 650,
              }}
            >
              {t.retry}
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
