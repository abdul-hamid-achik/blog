import { env } from "@/env.mjs";
import { getSiteOwnerEmail } from "@/lib/auth";
import {
  getSiteInboundEmail,
  InboundEmailForwardingError,
  InvalidInboundEmailConfigurationError,
  InvalidInboundEmailEventError,
  processInboundEmail,
} from "@/lib/inbound-email";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(env.RESEND_API_KEY);

function invalidWebhookResponse() {
  return NextResponse.json(
    { ok: false, error: "Invalid webhook" },
    { status: 400 },
  );
}

export async function POST(request: Request) {
  const webhookSecret = env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "Webhook is not configured" },
      { status: 503 },
    );
  }

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) return invalidWebhookResponse();

  let event: unknown;
  try {
    const payload = await request.text();
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch {
    return invalidWebhookResponse();
  }

  try {
    const result = await processInboundEmail(event, {
      forwarder: resend.emails.receiving,
      inboundEmail: getSiteInboundEmail(),
      ownerEmail: getSiteOwnerEmail(),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (
      error instanceof InvalidInboundEmailEventError ||
      error instanceof InvalidInboundEmailConfigurationError
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid inbound email event" },
        { status: 400 },
      );
    }

    if (error instanceof InboundEmailForwardingError) {
      console.error("Inbound email forwarding failed", {
        errorName: error.name,
      });
      return NextResponse.json(
        { ok: false, error: "Email forwarding failed" },
        { status: 502 },
      );
    }

    console.error("Unexpected inbound email webhook failure", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { ok: false, error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
