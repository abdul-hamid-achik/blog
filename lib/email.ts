import { env } from "@/env.mjs";
import { routing } from "@/routing";
import { Resend } from "resend";

const resend = new Resend(env.RESEND_API_KEY);

type EmailLocale = (typeof routing.locales)[number];

interface MagicLinkEmailCopy {
  subject: string;
  preview: string;
  label: string;
  heading: string;
  introduction: string;
  instructions: string;
  action: string;
  expiry: string;
  fallbackHeading: string;
  fallbackInstructions: string;
  ignore: string;
  footer: string;
}

const MAGIC_LINK_COPY = {
  en: {
    subject: "Your link to continue the conversation",
    preview:
      "Verify your email and return to the conversation on abdulachik.dev.",
    label: "Private conversation",
    heading: "Continue where we left off",
    introduction:
      "You asked for a secure link to keep chatting on abdulachik.dev.",
    instructions:
      "Confirm your email address with the button below. You’ll return to the site ready to continue the conversation.",
    action: "Verify email and continue",
    expiry:
      "For your security, this link expires in one hour and can be used only once.",
    fallbackHeading: "If the button does not open",
    fallbackInstructions: "Copy and paste this address into your browser:",
    ignore: "If you did not request this email, you can safely ignore it.",
    footer:
      "Sent by abdulachik.dev because a sign-in link was requested for this address.",
  },
  es: {
    subject: "Tu enlace para continuar la conversación",
    preview: "Verifica tu correo y vuelve a la conversación en abdulachik.dev.",
    label: "Conversación privada",
    heading: "Continúa donde lo dejamos",
    introduction:
      "Solicitaste un enlace seguro para seguir conversando en abdulachik.dev.",
    instructions:
      "Confirma tu correo con el botón de abajo. Volverás al sitio con todo listo para continuar la conversación.",
    action: "Verificar correo y continuar",
    expiry:
      "Por tu seguridad, este enlace caduca en una hora y solo puede usarse una vez.",
    fallbackHeading: "Si el botón no se abre",
    fallbackInstructions: "Copia y pega esta dirección en tu navegador:",
    ignore: "Si no solicitaste este correo, puedes ignorarlo con tranquilidad.",
    footer:
      "Enviado por abdulachik.dev porque se solicitó un enlace de acceso para esta dirección.",
  },
  ru: {
    subject: "Ваша ссылка для продолжения разговора",
    preview:
      "Подтвердите адрес почты и вернитесь к разговору на abdulachik.dev.",
    label: "Личный разговор",
    heading: "Продолжим с того места, где остановились",
    introduction:
      "Вы запросили безопасную ссылку, чтобы продолжить разговор на abdulachik.dev.",
    instructions:
      "Подтвердите адрес электронной почты с помощью кнопки ниже. После этого вы вернётесь на сайт и сможете продолжить беседу.",
    action: "Подтвердить почту и продолжить",
    expiry:
      "В целях безопасности ссылка действительна один час и может быть использована только один раз.",
    fallbackHeading: "Если кнопка не открывается",
    fallbackInstructions: "Скопируйте этот адрес и вставьте его в браузер:",
    ignore: "Если вы не запрашивали это письмо, просто проигнорируйте его.",
    footer:
      "Письмо отправлено сайтом abdulachik.dev, потому что для этого адреса запросили ссылку для входа.",
  },
} satisfies Record<EmailLocale, MagicLinkEmailCopy>;

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

function resolveEmailLocale(locale: string): EmailLocale {
  return (
    routing.locales.find((supportedLocale) => supportedLocale === locale) ??
    routing.defaultLocale
  );
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) => HTML_ENTITIES[character] ?? character,
  );
}

function renderMagicLinkHtml(
  copy: MagicLinkEmailCopy,
  locale: EmailLocale,
  magicLink: string,
) {
  const safeLink = escapeHtml(magicLink);

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${copy.subject}</title>
  </head>
  <body style="margin:0;background-color:#f3f0e8;color:#20211f;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${copy.preview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f3f0e8;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#faf8f2;border:1px solid #d4cebf;border-top:4px solid #9c3f25;">
            <tr>
              <td style="padding:28px 36px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:0.16em;line-height:1.4;color:#20211f;">
                      ABDULACHIK.DEV
                    </td>
                    <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.1em;line-height:1.4;text-transform:uppercase;color:#65655e;">
                      ${copy.label}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 36px 12px;">
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:400;letter-spacing:-0.02em;line-height:1.12;color:#20211f;">
                  ${copy.heading}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 36px 0;">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#292a27;">${copy.introduction}</p>
                <p style="margin:0;font-size:16px;line-height:1.65;color:#292a27;">${copy.instructions}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 36px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="background-color:#9c3f25;">
                      <a href="${safeLink}" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:700;line-height:1.2;color:#fffaf4;text-decoration:none;">
                        ${copy.action}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 28px;">
                <p style="margin:0;padding:14px 16px;border-left:3px solid #9c3f25;background-color:#e8e3d7;font-size:13px;line-height:1.55;color:#65655e;">
                  ${copy.expiry}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px;border-top:1px solid #d4cebf;">
                <p style="margin:0 0 8px;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:0.08em;line-height:1.4;text-transform:uppercase;color:#20211f;">
                  ${copy.fallbackHeading}
                </p>
                <p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:#65655e;">${copy.fallbackInstructions}</p>
                <a href="${safeLink}" style="font-family:'Courier New',Courier,monospace;font-size:11px;line-height:1.55;color:#9c3f25;text-decoration:underline;word-break:break-all;">${safeLink}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 36px;background-color:#20211f;">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.55;color:#ece9e1;">${copy.ignore}</p>
                <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.04em;line-height:1.55;color:#aaa9a2;">${copy.footer}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderMagicLinkText(copy: MagicLinkEmailCopy, magicLink: string) {
  return [
    copy.heading,
    "",
    copy.introduction,
    copy.instructions,
    "",
    `${copy.action}: ${magicLink}`,
    "",
    copy.expiry,
    "",
    copy.ignore,
    copy.footer,
  ].join("\n");
}

export async function sendMagicLinkEmail(
  email: string,
  token: string,
  locale: string,
) {
  const emailLocale = resolveEmailLocale(locale);
  const copy = MAGIC_LINK_COPY[emailLocale];
  const verificationUrl = new URL("/api/auth/verify", env.NEXT_PUBLIC_APP_URL);

  verificationUrl.searchParams.set("token", token);
  verificationUrl.searchParams.set("locale", emailLocale);

  const magicLink = verificationUrl.toString();

  try {
    const { data, error } = await resend.emails.send({
      from: "Abdul Hamid Achik <noreply@abdulachik.dev>",
      to: [email],
      subject: copy.subject,
      html: renderMagicLinkHtml(copy, emailLocale, magicLink),
      text: renderMagicLinkText(copy, magicLink),
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error sending magic link email:", error);
    throw new Error("Failed to send verification email", { cause: error });
  }
}
