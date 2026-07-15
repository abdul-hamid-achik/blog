import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  env: {
    SITE_INBOUND_EMAIL: undefined as string | undefined,
  },
  forward: vi.fn(),
}));

vi.mock("@/env.mjs", () => ({ env: mocks.env }));

import {
  DEFAULT_SITE_INBOUND_EMAIL,
  getSiteInboundEmail,
  InboundEmailForwardingError,
  type InboundEmailForwarder,
  INBOUND_FORWARD_FROM,
  InvalidInboundEmailConfigurationError,
  InvalidInboundEmailEventError,
  processInboundEmail,
} from "../lib/inbound-email";

const inboundEmail = "hello@abdulachik.dev";
const ownerEmail = "owner@example.com";

function receivedEvent(
  overrides: Partial<{
    email_id: string;
    from: string;
    to: string[];
  }> = {},
) {
  return {
    type: "email.received",
    created_at: "2026-07-14T00:00:00.000Z",
    data: {
      email_id: "received-email-1",
      from: "Reader <reader@example.com>",
      to: [inboundEmail],
      ...overrides,
    },
  };
}

function dependencies(
  overrides: Partial<{
    inboundEmail: string;
    ownerEmail: string;
  }> = {},
) {
  return {
    forwarder: {
      forward: mocks.forward,
    } as unknown as InboundEmailForwarder,
    inboundEmail,
    ownerEmail,
    ...overrides,
  };
}

describe("inbound email forwarding", () => {
  beforeEach(() => {
    mocks.env.SITE_INBOUND_EMAIL = undefined;
    mocks.forward.mockReset();
    mocks.forward.mockResolvedValue({
      data: { id: "forwarded-email-1" },
      error: null,
    });
  });

  it("uses the public inbox default unless SITE_INBOUND_EMAIL is configured", () => {
    expect(getSiteInboundEmail()).toBe(DEFAULT_SITE_INBOUND_EMAIL);

    mocks.env.SITE_INBOUND_EMAIL = "inbox@example.com";
    expect(getSiteInboundEmail()).toBe("inbox@example.com");
  });

  it("ignores verified webhook events that are not inbound email", async () => {
    await expect(
      processInboundEmail(
        { type: "email.delivered", data: { email_id: "sent-1" } },
        dependencies(),
      ),
    ).resolves.toEqual({ action: "ignored", reason: "event_type" });
    expect(mocks.forward).not.toHaveBeenCalled();
  });

  it("ignores email addressed to a different recipient", async () => {
    await expect(
      processInboundEmail(
        receivedEvent({ to: ["someone-else@abdulachik.dev"] }),
        dependencies(),
      ),
    ).resolves.toEqual({ action: "ignored", reason: "recipient" });
    expect(mocks.forward).not.toHaveBeenCalled();
  });

  it("matches display-name recipients without case sensitivity", async () => {
    await expect(
      processInboundEmail(
        receivedEvent({ to: ["AbdulAchik Inbox <HELLO@ABDULACHIK.DEV>"] }),
        dependencies(),
      ),
    ).resolves.toEqual({
      action: "forwarded",
      id: "forwarded-email-1",
    });
  });

  it.each([
    {
      label: "the forwarding identity sent the inbound email",
      event: receivedEvent({
        from: "AbdulAchik Inbox <forwarding@abdulachik.dev>",
      }),
      config: {},
    },
    {
      label: "the owner sent the inbound email",
      event: receivedEvent({ from: "Owner <owner@example.com>" }),
      config: {},
    },
    {
      label: "the owner is already an original recipient",
      event: receivedEvent({ to: [inboundEmail, ownerEmail] }),
      config: {},
    },
    {
      label: "the inbox forwards back to itself",
      event: receivedEvent(),
      config: { ownerEmail: inboundEmail },
    },
    {
      label: "the target is the forwarding identity",
      event: receivedEvent(),
      config: { ownerEmail: "forwarding@abdulachik.dev" },
    },
  ])("prevents a loop when $label", async ({ event, config }) => {
    await expect(
      processInboundEmail(event, dependencies(config)),
    ).resolves.toEqual({ action: "ignored", reason: "loop" });
    expect(mocks.forward).not.toHaveBeenCalled();
  });

  it("forwards the original message and attachments with an idempotency key", async () => {
    await expect(
      processInboundEmail(receivedEvent(), dependencies()),
    ).resolves.toEqual({
      action: "forwarded",
      id: "forwarded-email-1",
    });

    expect(mocks.forward).toHaveBeenCalledOnce();
    expect(mocks.forward).toHaveBeenCalledWith(
      {
        emailId: "received-email-1",
        from: INBOUND_FORWARD_FROM,
        passthrough: true,
        to: ownerEmail,
      },
      { idempotencyKey: "inbound-forward/received-email-1" },
    );
  });

  it.each([
    undefined,
    { email_id: "", from: "reader@example.com", to: [inboundEmail] },
    { email_id: "email-1", from: 42, to: [inboundEmail] },
    { email_id: "email-1", from: "reader@example.com", to: [42] },
    {
      email_id: "x".repeat(256),
      from: "reader@example.com",
      to: [inboundEmail],
    },
  ])("rejects malformed email.received data %#", async (data) => {
    await expect(
      processInboundEmail({ type: "email.received", data }, dependencies()),
    ).rejects.toBeInstanceOf(InvalidInboundEmailEventError);
    expect(mocks.forward).not.toHaveBeenCalled();
  });

  it.each([{ inboundEmail: "not-an-email" }, { ownerEmail: "not-an-email" }])(
    "rejects invalid forwarding configuration %#",
    async (config) => {
      await expect(
        processInboundEmail(receivedEvent(), dependencies(config)),
      ).rejects.toBeInstanceOf(InvalidInboundEmailConfigurationError);
      expect(mocks.forward).not.toHaveBeenCalled();
    },
  );

  it("wraps both provider error responses and thrown failures", async () => {
    mocks.forward.mockResolvedValueOnce({
      data: null,
      error: { message: "provider rejected the forward" },
    });
    await expect(
      processInboundEmail(receivedEvent(), dependencies()),
    ).rejects.toBeInstanceOf(InboundEmailForwardingError);

    mocks.forward.mockRejectedValueOnce(new Error("network failure"));
    await expect(
      processInboundEmail(receivedEvent(), dependencies()),
    ).rejects.toBeInstanceOf(InboundEmailForwardingError);
  });
});
