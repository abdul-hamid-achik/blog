import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  Resend: vi.fn(),
  getSiteOwnerEmail: vi.fn(() => "owner@example.com"),
  env: { RESEND_API_KEY: "resend-key" },
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
vi.mock("@/lib/auth", () => ({
  getSiteOwnerEmail: mocks.getSiteOwnerEmail,
}));

import { sendConciergeMessageEmail } from "../lib/concierge-email";

describe("concierge contact email", () => {
  beforeEach(() => {
    mocks.send.mockResolvedValue({ data: { id: "message-1" }, error: null });
  });

  it.each([
    ["en", "Concierge message", "Verified sender", "Message"],
    ["es", "Mensaje del concierge", "Remitente verificado", "Mensaje"],
    ["ru", "Сообщение от консьержа", "Подтверждённый отправитель", "Сообщение"],
  ])(
    "sends a safe, localized owner message for %s",
    async (locale, label, senderLabel, messageLabel) => {
      await expect(
        sendConciergeMessageEmail({
          subject: "Project hello\r\nBcc: attacker@example.com",
          message: "Could we talk about <Cairn> & its roadmap?",
          senderEmail: "reader@example.com",
          locale,
          sessionId: "session-123",
          currentPageUrl: "https://www.abdulachik.dev/projects?from=a&b=c",
        }),
      ).resolves.toEqual({ id: "message-1" });

      const [payload, options] = mocks.send.mock.calls.at(-1) as [
        {
          from: string;
          to: string[];
          replyTo: string;
          subject: string;
          html: string;
          text: string;
          tags: Array<{ name: string; value: string }>;
        },
        { idempotencyKey: string },
      ];

      expect(payload).toMatchObject({
        from: "AbdulAchik Concierge <concierge@abdulachik.dev>",
        to: ["owner@example.com"],
        replyTo: "reader@example.com",
        subject: "[Concierge] Project hello Bcc: attacker@example.com",
        tags: [
          { name: "source", value: "concierge" },
          { name: "locale", value: locale },
        ],
      });
      expect(payload.html).toContain(`<html lang="${locale}">`);
      expect(payload.html).toContain(label);
      expect(payload.html).toContain(senderLabel);
      expect(payload.html).toContain(messageLabel);
      expect(payload.html).toContain("&lt;Cairn&gt; &amp; its roadmap?");
      expect(payload.html).toContain("?from=a&amp;b=c");
      expect(payload.html).not.toContain("<Cairn>");
      expect(payload.text).toContain(
        "Could we talk about <Cairn> & its roadmap?",
      );
      expect(options.idempotencyKey).toMatch(/^concierge-[a-f0-9]{64}$/);
    },
  );

  it("falls back to English, omits an absent page, and truncates the subject", async () => {
    await sendConciergeMessageEmail({
      subject: `  ${"a".repeat(130)}  `,
      message: "A private note",
      senderEmail: "reader@example.com",
      locale: "fr",
      sessionId: "session-456",
    });

    const payload = mocks.send.mock.calls.at(-1)?.[0] as {
      subject: string;
      html: string;
      text: string;
      tags: Array<{ name: string; value: string }>;
    };
    expect(payload.subject).toBe(`[Concierge] ${"a".repeat(120)}`);
    expect(payload.html).toContain('<html lang="en">');
    expect(payload.html).not.toContain("<strong>Page:</strong>");
    expect(payload.text).not.toContain("Page:");
    expect(payload.tags).toContainEqual({ name: "locale", value: "en" });
  });

  it("uses deterministic idempotency and changes it with the message", async () => {
    const base = {
      subject: "A subject",
      message: "First message",
      senderEmail: "reader@example.com",
      locale: "en",
      sessionId: "session-789",
    };

    await sendConciergeMessageEmail(base);
    await sendConciergeMessageEmail(base);
    await sendConciergeMessageEmail({ ...base, message: "Second message" });

    const keys = mocks.send.mock.calls
      .slice(-3)
      .map((call) => (call[1] as { idempotencyKey: string }).idempotencyKey);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it("hides provider errors and missing message ids behind a stable failure", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const input = {
      subject: "A subject",
      message: "A message",
      senderEmail: "reader@example.com",
      locale: "en",
      sessionId: "session-error",
    };

    mocks.send.mockResolvedValueOnce({
      data: null,
      error: new Error("provider rejected"),
    });
    await expect(sendConciergeMessageEmail(input)).rejects.toThrow(
      "Failed to send concierge message",
    );

    mocks.send.mockResolvedValueOnce({ data: null, error: null });
    await expect(sendConciergeMessageEmail(input)).rejects.toThrow(
      "Failed to send concierge message",
    );

    mocks.send.mockRejectedValueOnce(new Error("network unavailable"));
    await expect(sendConciergeMessageEmail(input)).rejects.toThrow(
      "Failed to send concierge message",
    );
    expect(error).toHaveBeenCalledTimes(3);
  });
});
