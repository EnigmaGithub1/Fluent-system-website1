# Production Checklist

Everything to verify before taking this site live with real payments. Nothing here is automatic —
each item is a deliberate action you (or whoever operates this site) needs to take.

## Paddle Live

- [ ] Switch the Paddle dashboard to **Live** mode and complete Paddle's account verification /
      business details (required before you can accept real payments).
- [ ] Re-create both products and prices in the **Live** catalog — Sandbox and Live catalogs are
      entirely separate; Sandbox price IDs will not work in production.
- [ ] Generate a **Live** client-side token (Developer Tools > Authentication).
- [ ] Generate a **Live** API key if you use `lib/paddle/server.ts`.
- [ ] Set `PADDLE_ENV=production` and `NEXT_PUBLIC_PADDLE_ENV=production`.
- [ ] Update `PADDLE_FLUENT_PRICE_ID` / `PADDLE_COMPLETE_PRICE_ID` to the new Live price IDs.
- [ ] Double-check `PADDLE_FLUENT_PRICE_ID` ≠ a sandbox id (a common deploy mistake — the app will
      silently reject checkouts with "no configured product matches this price id" if you mix them).

## Domain

- [ ] Point your real domain at your production deployment.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real `https://` domain (used to build email links and the
      webhook URL you register with Paddle).
- [ ] Confirm HTTPS is enforced — Paddle requires an HTTPS webhook endpoint in production.

## Payments

- [ ] Confirm both CheckoutButton instances (landing page, /checkout) open real Live checkouts and
      show the correct live price.
- [ ] Confirm the /checkout page cannot be manipulated client-side to change the charged amount —
      by design, the amount is only ever determined by the Paddle price ID resolved server-side via
      `lib/products.ts`; there is no code path where a dollar amount is sent from the browser.

## Webhooks

- [ ] Create a **new** notification destination in the Live dashboard pointed at
      `https://YOUR-REAL-DOMAIN/api/paddle/webhook` (this is a different secret from your sandbox
      destination — do not reuse the sandbox secret).
- [ ] Subscribe it to `transaction.completed` and `transaction.paid`.
- [ ] Set `PADDLE_WEBHOOK_SECRET` to the new destination's secret.
- [ ] Send a real (small) test purchase through and confirm the webhook lands, the order is
      created, and the confirmation email sends.
- [ ] Set up alerting on your `WebhookEvent` table (or application logs) for rows where
      `processedOk = false` — these indicate a fulfillment failure that needs manual follow-up
      (see the note in `api/paddle/webhook/route.ts` about why we return 200 even on failure).

## Email

- [ ] Connect a real `EMAIL_PROVIDER` / `EMAIL_PROVIDER_API_KEY` (Resend is implemented; see
      README for adding another provider).
- [ ] Verify your sending domain with your email provider (SPF/DKIM) so confirmation emails don't
      land in spam.
- [ ] Send a real test purchase confirmation end-to-end and check it arrives, renders correctly,
      and the download link works.
- [ ] Confirm `SUPPORT_EMAIL` is a real, monitored inbox.

## Download security

- [ ] Switch `DOWNLOAD_STORAGE_DRIVER` from `local` to `s3` (or your chosen object store).
- [ ] Implement signed-URL generation for your chosen store in
      `lib/download.ts` → `resolveDownloadSource()` (currently a clear extension point, not
      guessed at, since bucket/CDN setup is specific to your infrastructure).
- [ ] Upload `FLUENT-Social-Fluency-System.pdf` and `FLUENT_COMPLETE.zip` to that store.
- [ ] Confirm the bucket/object store itself is NOT publicly listable or guessable — access should
      only be possible via a signed URL issued by your app.
- [ ] Set a real, random `DOWNLOAD_TOKEN_SECRET` (32+ bytes) — different from any value used in
      development.
- [ ] Decide and implement a refund → access-revocation policy if you want refunds to actually
      disable a customer's download access (not implemented by default in this starter — currently
      a refund event is not among `HANDLED_EVENT_TYPES`; add `transaction.refunded` handling if you
      want this).

## Analytics

- [ ] Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` / `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_TIKTOK_PIXEL_ID`
      for whichever platforms you're actually running ads on.
- [ ] Confirm `purchase_completed` fires exactly once per real purchase (check for double-firing if
      you customize `ThankYouStatus.tsx`).
- [ ] Review your pixels' data collection against each platform's current advertising policies.

## Legal

- [ ] Replace every `[DATE — fill in before launch]` and bracketed placeholder in
      `src/app/legal/*` with real, lawyer-reviewed copy.
- [ ] Confirm your Refund Policy matches what you've actually configured as your refund window in
      Paddle (Paddle handles the actual refund transaction as Merchant of Record, but your stated
      policy and your practice should match).
- [ ] Link to Paddle's own privacy policy from your Privacy Policy page where you describe their
      role in payment processing.

## Product files

- [ ] Confirm the production PDF/ZIP files match what customers are told they're buying (no stale
      drafts).
- [ ] Confirm `downloadPackage` filenames in `lib/products.ts` match the actual filenames in your
      object store exactly (case-sensitive).

## Error monitoring

- [ ] Connect a real error-monitoring tool (e.g. Sentry) — none is wired up by default. Pay
      particular attention to the webhook route and the download route, since silent failures
      there directly cost customers access to what they paid for.
- [ ] Confirm customer-facing error states (checkout failure, expired download link, missing file)
      never leak a raw stack trace — review `api/download/[token]/route.ts` and
      `ThankYouStatus.tsx` for the current customer-friendly messages and adjust copy as needed.

## Backups

- [ ] Set up automated backups for your production database (Customer/Order/ProductAccess data).
- [ ] Confirm your object store (product files) has versioning or backup enabled.

## Testing (run all of these against Live with a real low-value purchase, not just Sandbox)

1. FLUENT → checkout → successful payment → webhook → FLUENT access granted
2. FLUENT COMPLETE → checkout → successful payment → webhook → Complete access granted
3. Buy FLUENT, then separately buy Complete with the same email → customer ends up owning both
4. Cancel/abandon a checkout → confirm no order is created and no access is granted
5. Manually re-deliver a webhook event from the Paddle dashboard (or replay the same payload) →
   confirm no duplicate order and no duplicate email (check the `WebhookEvent` idempotency table)
6. Attempt to access `/api/download/[token]` with a token for a product not purchased → confirmed
   denied (this should be structurally impossible since tokens are only issued for owned products,
   but verify anyway)
7. Confirm the purchase confirmation email's access link actually opens the correct file
8. Confirm the download link works correctly after expiry (`DOWNLOAD_LINK_TTL_HOURS`) — should show
   a clear "link expired, request a new one" state, not a broken page
9. Full checkout flow on a real mobile device (not just responsive devtools) at your actual domain
10. Full checkout flow on desktop, in at least two browsers
