// src/app/legal/refund/page.tsx
import LegalPageShell from '@/components/LegalPageShell';

export default function RefundPage() {
  return (
    <LegalPageShell title="Refund Policy" updated="[DATE — fill in before launch]">
      <p>
        [This is a placeholder policy. Decide your actual refund window and conditions, then update
        this page — and configure the matching rules in your Paddle dashboard, since Paddle
        processes refunds on your behalf as Merchant of Record.]
      </p>

      <h2>Requesting a refund</h2>
      <p>
        To request a refund, contact {process.env.SUPPORT_EMAIL || 'support@yourdomain.com'} with
        your order number (found in your confirmation email) and the reason for your request.
        [Fill in your refund window, e.g. "within 14 days of purchase."]
      </p>

      <h2>How refunds are processed</h2>
      <p>
        Refunds are issued through Paddle, our Merchant of Record, back to your original payment
        method. Processing times depend on your payment provider and are typically a few business
        days.
      </p>

      <h2>Access after a refund</h2>
      <p>
        [Fill in your policy — e.g. "download access is revoked once a refund is processed."] This
        should match the access-revocation behavior you actually implement — see
        PRODUCTION_CHECKLIST.md for the corresponding engineering task (this starter project does
        not yet implement automatic access revocation on refund; see the note in
        PRODUCTION_CHECKLIST.md).
      </p>

      <h2>Digital product considerations</h2>
      <p>
        [Some jurisdictions have specific rules around refunds for digital products once
        downloaded/accessed — confirm your policy complies with rules applicable to your customers'
        locations, which Paddle's Merchant-of-Record status may also affect.]
      </p>
    </LegalPageShell>
  );
}
