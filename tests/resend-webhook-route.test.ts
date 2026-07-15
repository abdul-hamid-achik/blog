import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  env: {
    RESEND_API_KEY: "resend-key",
    RESEND_WEBHOOK_SECRET: "whsec_test" as string | undefined,
    SITE_INBOUND_EMAIL: undefined as string | undefined,
  },
  forward: vi.fn(),
  getSiteOwnerEmail: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/env.mjs", () => ({ env: mocks.env }));
vi.mock("@/lib/auth", () => ({
  getSiteOwnerEmail: mocks.getSiteOwnerEmail,
}));
vi.mock("resend", () => ({
  Resend: class ResendMock {
    webhooks = { verify: mocks.verify };
    emails = { receiving: { forward: mocks.forward } };
  },
}));

import { POST } from "../app/api/webhooks/resend/route";

const rawPayload = '{"type":"email.received","data":{"email_id":"email-1"}}';
const receivedEvent = {
  type: "email.received",
  data: {
    email_id: "email-1",
    from: "Reader <reader@example.com>",
    to: ["hello@abdulachik.dev"],
  },
};

function webhookRequest(
  headers: Record<string, string | undefined> = {},
  body = rawPayload,
) {
  const requestHeaders = new Headers({
    "content-type": "application/json",
    "svix-id": "msg_1",
    "svix-signature": "v1,signature",
    "svix-timestamp": "1720915200",
  });

  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) requestHeaders.delete(name);
    else requestHeaders.set(name, value);
  }

  return new Request("http://localhost/api/webhooks/resend", {
    method: "POST",
    headers: requestHeaders,
    body,
  });
}

async function json(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("POST /api/webhooks/resend", () => {
  beforeEach(() => {
    mocks.env.RESEND_WEBHOOK_SECRET = "whsec_test";
    mocks.env.SITE_INBOUND_EMAIL = undefined;
    mocks.getSiteOwnerEmail.mockReset();
    mocks.getSiteOwnerEmail.mockReturnValue("owner@example.com");
    mocks.verify.mockReset();
    mocks.verify.mockReturnValue(receivedEvent);
    mocks.forward.mockReset();
    mocks.forward.mockResolvedValue({
      data: { id: "forwarded-email-1" },
      error: null,
    });
  });

  it("fails closed when the signing secret is not configured", async () => {
    mocks.env.RESEND_WEBHOOK_SECRET = undefined;

    const response = await POST(webhookRequest());

    expect(response.status).toBe(503);
    expect(await json(response)).toEqual({
      ok: false,
      error: "Webhook is not configured",
    });
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.forward).not.toHaveBeenCalled();
  });

  it.each(["svix-id", "svix-timestamp", "svix-signature"])(
    "rejects a request missing %s before reading or forwarding it",
    async (header) => {
      const response = await POST(webhookRequest({ [header]: undefined }));

      expect(response.status).toBe(400);
      expect(await json(response)).toEqual({
        ok: false,
        error: "Invalid webhook",
      });
      expect(mocks.verify).not.toHaveBeenCalled();
      expect(mocks.forward).not.toHaveBeenCalled();
    },
  );

  it("verifies the untouched raw body and exact Svix headers", async () => {
    const response = await POST(webhookRequest({}, rawPayload));

    expect(response.status).toBe(200);
    expect(mocks.verify).toHaveBeenCalledOnce();
    expect(mocks.verify).toHaveBeenCalledWith({
      payload: rawPayload,
      headers: {
        id: "msg_1",
        signature: "v1,signature",
        timestamp: "1720915200",
      },
      webhookSecret: "whsec_test",
    });
  });

  it("rejects an invalid signature without processing the event", async () => {
    mocks.verify.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const response = await POST(webhookRequest());

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      ok: false,
      error: "Invalid webhook",
    });
    expect(mocks.forward).not.toHaveBeenCalled();
  });

  it("acknowledges verified webhook event types that are not email.received", async () => {
    mocks.verify.mockReturnValue({
      type: "email.delivered",
      data: { email_id: "sent-email-1" },
    });

    const response = await POST(webhookRequest());

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      ok: true,
      action: "ignored",
      reason: "event_type",
    });
    expect(mocks.forward).not.toHaveBeenCalled();
  });

  it("acknowledges email for an unconfigured recipient without forwarding", async () => {
    mocks.verify.mockReturnValue({
      ...receivedEvent,
      data: { ...receivedEvent.data, to: ["other@abdulachik.dev"] },
    });

    const response = await POST(webhookRequest());

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      ok: true,
      action: "ignored",
      reason: "recipient",
    });
    expect(mocks.forward).not.toHaveBeenCalled();
  });

  it("uses configured routing and forwards a valid inbound event once", async () => {
    mocks.env.SITE_INBOUND_EMAIL = "inbox@example.com";
    mocks.verify.mockReturnValue({
      ...receivedEvent,
      data: { ...receivedEvent.data, to: ["Inbox <INBOX@EXAMPLE.COM>"] },
    });

    const response = await POST(webhookRequest());

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({
      ok: true,
      action: "forwarded",
      id: "forwarded-email-1",
    });
    expect(mocks.getSiteOwnerEmail).toHaveBeenCalledOnce();
    expect(mocks.forward).toHaveBeenCalledWith(
      {
        emailId: "email-1",
        from: "AbdulAchik Inbox <forwarding@abdulachik.dev>",
        passthrough: true,
        to: "owner@example.com",
      },
      { idempotencyKey: "inbound-forward/email-1" },
    );
  });

  it("rejects a signed but malformed email.received event", async () => {
    mocks.verify.mockReturnValue({ type: "email.received", data: {} });

    const response = await POST(webhookRequest());

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      ok: false,
      error: "Invalid inbound email event",
    });
    expect(mocks.forward).not.toHaveBeenCalled();
  });

  it("rejects invalid inbound routing configuration without forwarding", async () => {
    mocks.env.SITE_INBOUND_EMAIL = "not-an-email";

    const response = await POST(webhookRequest());

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      ok: false,
      error: "Invalid inbound email event",
    });
    expect(mocks.forward).not.toHaveBeenCalled();
  });

  it("returns a generic 500 when an unexpected dependency failure occurs", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSiteOwnerEmail.mockImplementation(() => {
      throw new TypeError("unexpected-secret-detail");
    });

    const response = await POST(webhookRequest());
    const body = await json(response);

    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, error: "Webhook processing failed" });
    expect(JSON.stringify(body)).not.toContain("unexpected-secret-detail");
    expect(error).toHaveBeenCalledWith(
      "Unexpected inbound email webhook failure",
      { errorName: "TypeError" },
    );
    expect(mocks.forward).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it.each([
    {
      label: "an API error response",
      configure: () =>
        mocks.forward.mockResolvedValue({
          data: null,
          error: { message: "provider-secret-detail" },
        }),
    },
    {
      label: "a thrown provider failure",
      configure: () =>
        mocks.forward.mockRejectedValue(new Error("provider-secret-detail")),
    },
  ])("returns a retryable generic 502 for $label", async ({ configure }) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    configure();

    const response = await POST(webhookRequest());
    const body = await json(response);

    expect(response.status).toBe(502);
    expect(body).toEqual({ ok: false, error: "Email forwarding failed" });
    expect(JSON.stringify(body)).not.toContain("provider-secret-detail");
    expect(error).toHaveBeenCalledWith("Inbound email forwarding failed", {
      errorName: "InboundEmailForwardingError",
    });
    error.mockRestore();
  });
});
