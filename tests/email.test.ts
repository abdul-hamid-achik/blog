import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  Resend: vi.fn(),
  env: {
    RESEND_API_KEY: "resend-key",
    NEXT_PUBLIC_APP_URL: "https://www.abdulachik.dev",
  },
}));

vi.mock("resend", () => ({
  Resend: class ResendMock {
    emails = { send: mocks.send };

    constructor(apiKey: string) {
      mocks.Resend(apiKey);
    }
  },
}));
vi.mock("@/env.mjs", () => ({ env: mocks.env }));

import { sendMagicLinkEmail } from "../lib/email";

describe("magic-link email", () => {
  beforeEach(() => {
    mocks.send.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  it.each([
    [
      "en",
      "Your link to continue the conversation",
      "Verify email and continue",
    ],
    [
      "es",
      "Tu enlace para continuar la conversación",
      "Verificar correo y continuar",
    ],
    [
      "ru",
      "Ваша ссылка для продолжения разговора",
      "Подтвердить почту и продолжить",
    ],
  ])(
    "sends localized HTML and text for %s",
    async (locale, subject, action) => {
      await expect(
        sendMagicLinkEmail("reader@example.com", "token-value", locale),
      ).resolves.toEqual({ id: "email-1" });

      const payload = mocks.send.mock.calls.at(-1)?.[0] as {
        from: string;
        to: string[];
        subject: string;
        html: string;
        text: string;
      };
      expect(payload).toMatchObject({
        from: "Abdul Hamid Achik <noreply@abdulachik.dev>",
        to: ["reader@example.com"],
        subject,
      });
      expect(payload.html).toContain(`<html lang="${locale}">`);
      expect(payload.html).toContain("token=token-value");
      expect(payload.html).toContain(`locale=${locale}`);
      expect(payload.html).toContain("&amp;");
      expect(payload.text).toContain(`${action}: https://www.abdulachik.dev/`);
      expect(payload.text).not.toContain("<table");
    },
  );

  it("falls back to English and safely URL-encodes an untrusted token", async () => {
    await sendMagicLinkEmail(
      "reader@example.com",
      `"><script>alert('x')</script>&`,
      "fr",
    );

    const payload = mocks.send.mock.calls.at(-1)?.[0] as {
      subject: string;
      html: string;
    };
    expect(payload.subject).toBe("Your link to continue the conversation");
    expect(payload.html).toContain('<html lang="en">');
    expect(payload.html).not.toContain("<script>alert");
    expect(payload.html).toContain("%3Cscript%3Ealert");
  });

  it("wraps both provider responses and thrown failures", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.send.mockResolvedValueOnce({
      data: null,
      error: new Error("rejected"),
    });

    await expect(
      sendMagicLinkEmail("reader@example.com", "token", "en"),
    ).rejects.toThrow("Failed to send verification email");

    mocks.send.mockRejectedValueOnce(new Error("network failure"));
    await expect(
      sendMagicLinkEmail("reader@example.com", "token", "en"),
    ).rejects.toThrow("Failed to send verification email");
    expect(error).toHaveBeenCalledTimes(2);
  });
});
