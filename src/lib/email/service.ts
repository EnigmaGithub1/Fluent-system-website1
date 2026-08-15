// src/lib/email/service.ts
//
// Transactional email abstraction (master prompt section 34). Application
// code calls sendPurchaseConfirmation()/sendDownloadReminder() and never
// touches a specific provider's SDK directly — swapping Resend for
// Postmark or SendGrid later means editing only this file.
//
// IMPORTANT (section 36): this module sends TRANSACTIONAL email only.
// It never subscribes anyone to marketing email — that requires
// separate, explicit consent your checkout flow does not currently
// collect. Keep it that way unless you add a real opt-in.

import { renderPurchaseConfirmationEmail } from '@/lib/email/templates';
import type { Order } from '@prisma/client';

export interface SendResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Provider-agnostic send. Reads EMAIL_PROVIDER / EMAIL_PROVIDER_API_KEY
 * from the environment. If no provider is configured (e.g. local dev
 * without keys set up yet), it logs the email instead of sending —
 * the rest of the fulfillment flow still runs normally.
 */
async function send(message: EmailMessage): Promise<SendResult> {
  const provider = process.env.EMAIL_PROVIDER;
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const from = `${process.env.EMAIL_FROM_NAME || 'FLUENT'} <${process.env.EMAIL_FROM_ADDRESS || 'orders@example.com'}>`;

  if (!provider || !apiKey) {
    console.warn(
      '[email] No EMAIL_PROVIDER/EMAIL_PROVIDER_API_KEY configured — logging email instead of sending.\n',
      { to: message.to, subject: message.subject }
    );
    return { ok: true, providerMessageId: 'dev-mode-not-sent' };
  }

  try {
    switch (provider) {
      case 'resend':
        return await sendViaResend({ ...message, from, apiKey });
      // Add cases for 'postmark' | 'sendgrid' following the same
      // (to, subject, html, text, from, apiKey) -> SendResult shape.
      default:
        throw new Error(`Unsupported EMAIL_PROVIDER: "${provider}". Add an adapter in lib/email/service.ts.`);
    }
  } catch (err) {
    console.error('[email] send failed', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown email error' };
  }
}

async function sendViaResend(args: EmailMessage & { from: string; apiKey: string }): Promise<SendResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: args.from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { id: string };
  return { ok: true, providerMessageId: data.id };
}

/**
 * Sends the purchase confirmation + permanent access link email.
 * Called exclusively from the verified webhook handler after an
 * order and download token have been created — never from the
 * frontend.
 */
export async function sendPurchaseConfirmation(order: Order, downloadUrl: string): Promise<SendResult> {
  const { subject, html, text } = renderPurchaseConfirmationEmail(order, downloadUrl);
  return send({ to: order.customerEmail, subject, html, text });
}

/**
 * Optional: re-send access link if a customer emails support asking
 * "where's my download". Not wired to an automated trigger by default.
 */
export async function sendDownloadReminder(order: Order, downloadUrl: string): Promise<SendResult> {
  const { html, text } = renderPurchaseConfirmationEmail(order, downloadUrl);
  return send({
    to: order.customerEmail,
    subject: `Your ${order.productName} access link`,
    html,
    text,
  });
}

/**
 * Customer tagging (master prompt section 36) — e.g. for syncing to an
 * ESP's audience/segment. Deliberately a no-op stub: wire this to your
 * actual ESP's API if/when you want tagged segments. Never call this
 * in a way that implies marketing consent.
 */
export async function tagCustomer(email: string, tag: string): Promise<void> {
  console.log(`[email] would tag customer ${email} with "${tag}" (no ESP configured — no-op)`);
}
