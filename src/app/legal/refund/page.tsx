// src/app/legal/refund/page.tsx
import LegalPageShell from '@/components/LegalPageShell';

export default function RefundPage() {
  return (
    <LegalPageShell title="Refund Policy" updated="[DATE — fill in before launch]">
    

      <h2>Requesting a refund</h2>
      <p>
        To request a refund, contact {process.env.SUPPORT_EMAIL || 'support@yourdomain.com'} with
        your order number (found in your confirmation email) and the reason for your request.
         The window for refunds is within 14 days of purchase.
      </p>

      <h2>How refunds are processed</h2>
      <p>
        Refunds are issued through Paddle, our Merchant of Record, back to your original payment
        method. Processing times depend on your payment provider and are typically a few business
        days.
      </p>

      <h2>Access after a refund</h2>
      <p>
        Download access is revoked once a refund is processed.
      </p>

      <h2>Digital product considerations</h2>
      <p>
        Ensure your jurisdiction handles refunds of digital products properly, and contact the support email if you have any questions.
      </p>
    </LegalPageShell>
  );
}
