import { env } from "@/env.mjs";
import { getSiteOwnerEmail } from "@/lib/auth";
import { createHash } from "node:crypto";
import { Resend } from "resend";

const resend = new Resend(env.RESEND_API_KEY);

const CONTACT_COPY = {
  en: {
    label: "Concierge message",
    sender: "Verified sender",
    page: "Page",
    session: "Session",
    message: "Message",
  },
  es: {
    label: "Mensaje del concierge",
    sender: "Remitente verificado",
    page: "Página",
    session: "Sesión",
    message: "Mensaje",
  },
  ru: {
    label: "Сообщение от консьержа",
    sender: "Подтверждённый отправитель",
    page: "Страница",
    session: "Сеанс",
    message: "Сообщение",
  },
} as const;

type ContactLocale = keyof typeof CONTACT_COPY;

export interface ConciergeEmailInput {
  subject: string;
  message: string;
  senderEmail: string;
  locale: string;
  sessionId: string;
  currentPageUrl?: string;
}

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) => HTML_ENTITIES[character] ?? character,
  );
}

function resolveContactLocale(locale: string): ContactLocale {
  return locale in CONTACT_COPY ? (locale as ContactLocale) : "en";
}

function sanitizeSubject(subject: string) {
  return subject
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 120);
}

function renderContactHtml(input: ConciergeEmailInput, locale: ContactLocale) {
  const copy = CONTACT_COPY[locale];
  const page = input.currentPageUrl
    ? `<p style="margin:4px 0;color:#65655e;"><strong>${copy.page}:</strong> ${escapeHtml(input.currentPageUrl)}</p>`
    : "";

  return `<!doctype html>
<html lang="${locale}">
  <body style="margin:0;background:#f3f0e8;color:#20211f;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f0e8;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;border:1px solid #d4cebf;border-top:4px solid #9c3f25;background:#faf8f2;">
            <tr>
              <td style="padding:28px 32px 18px;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">ABDULACHIK.DEV / ${copy.label}</td>
            </tr>
            <tr>
              <td style="padding:0 32px 22px;">
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:400;line-height:1.15;">${escapeHtml(sanitizeSubject(input.subject))}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #d4cebf;border-bottom:1px solid #d4cebf;font-size:13px;line-height:1.55;">
                <p style="margin:4px 0;color:#65655e;"><strong>${copy.sender}:</strong> ${escapeHtml(input.senderEmail)}</p>
                ${page}
                <p style="margin:4px 0;color:#65655e;"><strong>${copy.session}:</strong> ${escapeHtml(input.sessionId)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 32px;">
                <p style="margin:0 0 10px;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9c3f25;">${copy.message}</p>
                <p style="margin:0;white-space:pre-wrap;font-size:16px;line-height:1.7;">${escapeHtml(input.message)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderContactText(input: ConciergeEmailInput, locale: ContactLocale) {
  const copy = CONTACT_COPY[locale];
  return [
    `${copy.label}: ${sanitizeSubject(input.subject)}`,
    `${copy.sender}: ${input.senderEmail}`,
    input.currentPageUrl ? `${copy.page}: ${input.currentPageUrl}` : null,
    `${copy.session}: ${input.sessionId}`,
    "",
    `${copy.message}:`,
    input.message,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export async function sendConciergeMessageEmail(input: ConciergeEmailInput) {
  const locale = resolveContactLocale(input.locale);
  const subject = sanitizeSubject(input.subject);
  const idempotencyKey = createHash("sha256")
    .update(`${input.sessionId}\0${subject}\0${input.message}`)
    .digest("hex");

  try {
    const { data, error } = await resend.emails.send(
      {
        from: "AbdulAchik Concierge <concierge@abdulachik.dev>",
        to: [getSiteOwnerEmail()],
        replyTo: input.senderEmail,
        subject: `[Concierge] ${subject}`,
        html: renderContactHtml(input, locale),
        text: renderContactText(input, locale),
        tags: [
          { name: "source", value: "concierge" },
          { name: "locale", value: locale },
        ],
      },
      { idempotencyKey: `concierge-${idempotencyKey}` },
    );

    if (error || !data?.id) {
      throw error ?? new Error("Resend returned no message id");
    }

    return data;
  } catch (error) {
    console.error("Concierge email delivery failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    throw new Error("Failed to send concierge message", { cause: error });
  }
}
