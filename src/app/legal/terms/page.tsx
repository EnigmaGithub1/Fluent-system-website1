// src/app/legal/terms/page.tsx
import LegalPageShell from '@/components/LegalPageShell';

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" updated="[DATE — fill in before launch]">
      

      <h2>What you're buying</h2>
      <p>
        FLUENT and FLUENT COMPLETE are digital products delivered as downloadable files (PDF, and a
        ZIP archive for Complete). Purchases are one-time payments — there is no subscription and no
        recurring charge.
      </p>

      <h2>License</h2>
      <p>
        Your purchase grants you a personal, non-transferable license to use the product for your
        own purposes. Redistribution, resale, or public sharing of the files is not permitted.
      </p>

      <h2>Payment &amp; billing</h2>
      <p>
        Payments are processed by Paddle.com, who act as the Merchant of Record for this
        transaction. Your statement will show a charge from Paddle. Paddle handles applicable sales
        tax/VAT collection based on your location.
      </p>

      <h2>Access</h2>
      <p>
        Upon successful payment, you receive permanent access to your purchased product via an
        emailed download link and the /download page on this site.
      </p>

      <h2>No guarantee of outcome</h2>
      <p>
        FLUENT is an educational and behavioral resource. It does not guarantee any particular
        social, romantic, or professional outcome, and it is not a substitute for professional
        mental health care.
      </p>

      <h2>Refunds</h2>
      <p>
        See our <a href="/legal/refund">Refund Policy</a> for details.
      </p>

      <h2>Changes to these terms</h2>
      <p>If there are any changes to these terms that are important, you will be informed via email.</p>

      <h2>Contact</h2>
      <p>{process.env.SUPPORT_EMAIL || 'support@yourdomain.com'}</p>
    </LegalPageShell>
  );
}
