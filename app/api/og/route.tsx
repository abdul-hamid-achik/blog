import { ImageResponse } from "next/og";

const copy = {
  en: {
    defaultTitle: "Tools for agents. Essays for humans.",
    software: "Software",
    writing: "Writing",
  },
  es: {
    defaultTitle: "Herramientas para agentes. Ensayos para personas.",
    software: "Software",
    writing: "Escritura",
  },
  ru: {
    defaultTitle: "Инструменты для агентов. Эссе для людей.",
    software: "Программы",
    writing: "Эссе",
  },
} as const;

type OgLocale = keyof typeof copy;

function getLocale(value: string | null): OgLocale {
  return value && value in copy ? (value as OgLocale) : "en";
}

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = getLocale(searchParams.get("locale"));
    const localizedCopy = copy[locale];
    const requestedTitle = searchParams.get("title")?.trim();
    const title = (requestedTitle || localizedCopy.defaultTitle).slice(0, 120);
    const titleSize = title.length > 80 ? 54 : title.length > 48 ? 64 : 76;

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "#20211f",
          backgroundColor: "#f3f0e8",
          backgroundImage:
            "linear-gradient(rgba(32,33,31,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(32,33,31,.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          padding: "68px 76px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "2px solid #d4cebf",
            paddingBottom: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                width: 58,
                height: 58,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f3f0e8",
                backgroundColor: "#20211f",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.04em",
              }}
            >
              AH
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 650,
                letterSpacing: "-0.02em",
              }}
            >
              Abdul Hamid Achik
            </div>
          </div>
          <div
            style={{
              display: "flex",
              color: "#9c3f25",
              fontSize: 16,
              fontWeight: 650,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            abdulachik.dev
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 34,
            maxWidth: 1080,
          }}
        >
          <div
            style={{ display: "flex", width: 8, backgroundColor: "#9c3f25" }}
          />
          <div
            style={{
              display: "flex",
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.055em",
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "2px solid #d4cebf",
            paddingTop: 24,
            color: "#65655e",
            fontSize: 16,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <span>{localizedCopy.software}</span>
          <span>{localizedCopy.writing}</span>
          <span>Guadalajara</span>
        </div>
      </div>,
      { width: 1200, height: 630 },
    );
  } catch (error: unknown) {
    console.error(error);
    return new Response(null, { status: 500 });
  }
}
