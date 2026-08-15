// src/lib/email/templates.ts
//
// Plain, on-brand transactional email templates. Kept dependency-free
// (no React Email / MJML) so the project has one less build step —
// swap in a templating library later if the email program grows.

import type { Order } from '@prisma/client';

const INK = '#201D19';
const RUST = '#A8552E';
const PAPER = '#FAF6EF';

export function renderPurchaseConfirmationEmail(order: Order, downloadUrl: string) {
  const firstName = order.firstName || 'there';
  const subject = `Your ${order.productName} purchase is ready`;

  const html = `
  <div style="background:${PAPER};padding:32px 16px;font-family:Georgia,serif;color:${INK};">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #DDD3C2;border-radius:8px;overflow:hidden;">
      <div style="background:${INK};padding:28px 32px;">
        <div style="color:${RUST};font-size:11px;letter-spacing:2px;text-transform:uppercase;font-style:italic;">FLUENT</div>
        <div style="color:#fff;font-size:22px;margin-top:6px;">Your purchase is ready</div>
      </div>
      <div style="padding:28px 32px;">
        <p style="font-size:15px;line-height:1.6;">Hi ${escapeHtml(firstName)},</p>
        <p style="font-size:15px;line-height:1.6;">
          Thanks for picking up <strong>${escapeHtml(order.productName)}</strong>. Your download is ready whenever you are.
        </p>

        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px;">
          <tr><td style="padding:6px 0;color:#79705F;">Order</td><td style="padding:6px 0;text-align:right;">${order.id}</td></tr>
          <tr><td style="padding:6px 0;color:#79705F;">Product</td><td style="padding:6px 0;text-align:right;">${escapeHtml(order.productName)}</td></tr>
          <tr><td style="padding:6px 0;color:#79705F;">Amount</td><td style="padding:6px 0;text-align:right;">$${order.amount} ${order.currency}</td></tr>
          <tr><td style="padding:6px 0;color:#79705F;">Date</td><td style="padding:6px 0;text-align:right;">${order.createdAt.toDateString()}</td></tr>
        </table>

        <div style="text-align:center;margin:28px 0;">
          <a href="${downloadUrl}" style="background:${RUST};color:#fff;padding:14px 28px;border-radius:4px;text-decoration:none;font-family:sans-serif;font-size:14px;display:inline-block;">
            Access Your Download
          </a>
        </div>

        <p style="font-size:13px;line-height:1.6;color:#5C5648;">
          Lost this email later? No problem — visit
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/download" style="color:${RUST};">${process.env.NEXT_PUBLIC_SITE_URL}/download</a>
          and enter this email address any time to get a fresh access link.
        </p>

        <p style="font-size:13px;line-height:1.6;color:#5C5648;margin-top:24px;">
          Questions? Just reply to this email, or reach us at
          <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color:${RUST};">${process.env.SUPPORT_EMAIL}</a>.
        </p>
      </div>
    </div>
  </div>`;

  const text = `Hi ${firstName},

Thanks for picking up ${order.productName}. Your download is ready.

Order: ${order.id}
Product: ${order.productName}
Amount: $${order.amount} ${order.currency}
Date: ${order.createdAt.toDateString()}

Access your download: ${downloadUrl}

Lost this email later? Visit ${process.env.NEXT_PUBLIC_SITE_URL}/download and enter this email address for a fresh link.

Questions? Reply to this email or contact ${process.env.SUPPORT_EMAIL}.
`;

  return { subject, html, text };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
