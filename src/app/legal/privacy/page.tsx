// src/app/legal/privacy/page.tsx
import LegalPageShell from '@/components/LegalPageShell';

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" updated="August 16, 2026">

      <h2>What we collect</h2>
      <p>
        When you make a purchase, we collect your email address, and optionally your first and last
        name. This information is used to fulfill your order, send your purchase confirmation and
        download link, and provide customer support. We do not collect or store payment card details
        — payment is processed entirely by Paddle.com, our Merchant of Record.
      </p>

      <h2>Paddle as Merchant of Record</h2>
      <p>
        Paddle.com acts as the merchant of record for all purchases and handles payment processing,
        billing, tax collection/remittance, and related compliance. Paddle&apos;s own privacy policy
        governs the payment data they collect directly. [Link to Paddle&apos;s privacy policy before
        launch.]
      </p>

      <h2>How we use your information</h2>
      <ul>
        <li>To deliver your purchased product and a permanent access link</li>
        <li>To send transactional emails (purchase confirmation, access-link recovery)</li>
        <li>To provide customer support if you contact us</li>
        <li>To maintain records required for accounting/tax purposes</li>
      </ul>
      <p>
        We do not use your email for marketing unless you separately and explicitly opt in
        elsewhere.
      </p>

      <h2>Data retention</h2>
      <p>
        [Fill in your actual retention policy — e.g. order records retained for accounting/legal
        requirements, typically several years depending on your jurisdiction.]
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, or delete your personal
        information. [Fill in the specific mechanism — e.g. an email address — and any
        jurisdiction-specific rights such as GDPR or CCPA that apply to your business.]
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy can be sent to{' '}
        {process.env.SUPPORT_EMAIL || 'support@yourdomain.com'}.
      </p>
    </LegalPageShell>
  );
}
