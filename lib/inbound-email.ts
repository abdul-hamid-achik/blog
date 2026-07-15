import { env } from "@/env.mjs";
import type {
  ForwardReceivingEmailOptions,
  ForwardReceivingEmailRequestOptions,
  ForwardReceivingEmailResponse,
} from "resend";

export const DEFAULT_SITE_INBOUND_EMAIL = "hello@abdulachik.dev";
export const INBOUND_FORWARD_FROM =
  "AbdulAchik Inbox <forwarding@abdulachik.dev>";

const FORWARDING_ADDRESS = "forwarding@abdulachik.dev";
const IDEMPOTENCY_PREFIX = "inbound-forward/";
const MAX_EMAIL_ID_LENGTH = 256 - IDEMPOTENCY_PREFIX.length;

export interface InboundEmailForwarder {
  forward(
    options: ForwardReceivingEmailOptions,
    requestOptions?: ForwardReceivingEmailRequestOptions,
  ): Promise<ForwardReceivingEmailResponse>;
}

export type InboundEmailResult =
  | { action: "ignored"; reason: "event_type" | "recipient" | "loop" }
  | { action: "forwarded"; id: string };

export class InvalidInboundEmailEventError extends Error {
  override name = "InvalidInboundEmailEventError";
}

export class InvalidInboundEmailConfigurationError extends Error {
  override name = "InvalidInboundEmailConfigurationError";
}

export class InboundEmailForwardingError extends Error {
  override name = "InboundEmailForwardingError";
}

interface EmailReceivedData {
  email_id: string;
  from: string;
  to: string[];
}

interface EmailReceivedEvent {
  type: "email.received";
  data: EmailReceivedData;
}

function normalizeEmailAddress(value: string) {
  const bracketedAddress = /<\s*([^<>]+)\s*>\s*$/.exec(value)?.[1];
  return (bracketedAddress ?? value).trim().toLocaleLowerCase("en");
}

function isEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseReceivedEvent(event: unknown): EmailReceivedEvent | null {
  if (!event || typeof event !== "object") return null;

  const candidate = event as { type?: unknown; data?: unknown };
  if (candidate.type !== "email.received") return null;
  if (!candidate.data || typeof candidate.data !== "object") {
    throw new InvalidInboundEmailEventError("Missing received email data");
  }

  const data = candidate.data as Record<string, unknown>;
  if (
    typeof data.email_id !== "string" ||
    data.email_id.length === 0 ||
    data.email_id.length > MAX_EMAIL_ID_LENGTH ||
    typeof data.from !== "string" ||
    !Array.isArray(data.to) ||
    !data.to.every((recipient) => typeof recipient === "string")
  ) {
    throw new InvalidInboundEmailEventError("Invalid received email data");
  }

  return {
    type: "email.received",
    data: {
      email_id: data.email_id,
      from: data.from,
      to: data.to,
    },
  };
}

function validateConfiguredAddress(value: string, label: string) {
  const address = normalizeEmailAddress(value);
  if (!isEmailAddress(address)) {
    throw new InvalidInboundEmailConfigurationError(
      `Invalid ${label} email address`,
    );
  }
  return address;
}

function wouldCreateForwardingLoop({
  inboundAddress,
  ownerAddress,
  recipients,
  senderAddress,
}: {
  inboundAddress: string;
  ownerAddress: string;
  recipients: string[];
  senderAddress: string;
}) {
  return (
    ownerAddress === inboundAddress ||
    ownerAddress === FORWARDING_ADDRESS ||
    senderAddress === FORWARDING_ADDRESS ||
    senderAddress === ownerAddress ||
    recipients.includes(ownerAddress)
  );
}

export function getSiteInboundEmail() {
  return env.SITE_INBOUND_EMAIL ?? DEFAULT_SITE_INBOUND_EMAIL;
}

export async function processInboundEmail(
  event: unknown,
  {
    forwarder,
    inboundEmail,
    ownerEmail,
  }: {
    forwarder: InboundEmailForwarder;
    inboundEmail: string;
    ownerEmail: string;
  },
): Promise<InboundEmailResult> {
  const receivedEvent = parseReceivedEvent(event);
  if (!receivedEvent) return { action: "ignored", reason: "event_type" };

  const inboundAddress = validateConfiguredAddress(inboundEmail, "inbound");
  const ownerAddress = validateConfiguredAddress(ownerEmail, "owner");
  const senderAddress = normalizeEmailAddress(receivedEvent.data.from);
  const recipients = receivedEvent.data.to.map(normalizeEmailAddress);

  if (!recipients.includes(inboundAddress)) {
    return { action: "ignored", reason: "recipient" };
  }

  if (
    wouldCreateForwardingLoop({
      inboundAddress,
      ownerAddress,
      recipients,
      senderAddress,
    })
  ) {
    return { action: "ignored", reason: "loop" };
  }

  let response: ForwardReceivingEmailResponse;
  try {
    response = await forwarder.forward(
      {
        emailId: receivedEvent.data.email_id,
        from: INBOUND_FORWARD_FROM,
        passthrough: true,
        to: ownerEmail,
      },
      {
        idempotencyKey: `${IDEMPOTENCY_PREFIX}${receivedEvent.data.email_id}`,
      },
    );
  } catch (cause) {
    throw new InboundEmailForwardingError("Resend forwarding failed", {
      cause,
    });
  }

  if (response.error || !response.data?.id) {
    throw new InboundEmailForwardingError("Resend forwarding failed", {
      cause: response.error,
    });
  }

  return { action: "forwarded", id: response.data.id };
}
