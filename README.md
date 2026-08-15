# FLUENT Website

Ecommerce website for **FLUENT** ($24.99) and **FLUENT COMPLETE** ($39.99) — two one-time-purchase
digital products, sold through **Paddle Billing**.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Prisma (SQLite for local dev).

---

## 1. What's in this repository

```
src/
  app/
    page.tsx                  Landing page
    checkout/page.tsx          Pre-checkout summary -> opens Paddle Checkout
    thank-you/page.tsx         Polls for webhook-confirmed fulfillment
    download/page.tsx          Email-based access-link recovery
    legal/                     Privacy / Terms / Refund templates
    api/
      paddle/webhook/route.ts  Authoritative fulfillment endpoint
      download/[token]/route.ts  Secure, token-gated file download
      access-link/route.ts     "Resend my download link" endpoint
      orders/status/route.ts   Polled by the thank-you page
  components/                 UI components (landing page sections, checkout UI)
  lib/
    products.ts                Centralized product/price configuration
    paddle/client.ts            Browser-side Paddle.js wrapper
    paddle/server.ts            Server-side Paddle REST API client
    paddle/webhook.ts           Webhook signature verification
    db.ts, customers.ts, orders.ts, access.ts   Data layer
    download.ts                 Signed download-token issuance/verification
    email/service.ts, templates.ts   Transactional email abstraction
    analytics.ts                 GA4 / Meta Pixel / TikTok Pixel abstraction
prisma/schema.prisma           Customer / Order / ProductAccess / WebhookEvent / DownloadToken models
PADDLE_SETUP.md                 Step-by-step Paddle Sandbox connection guide
PRODUCTION_CHECKLIST.md         Everything to check before going live
.env.example                    All required configuration, documented
```

---

## 2. Local development setup

**Requirements:** Node.js 18.17+, npm.

```bash
# 1. Install dependencies
npm install

# 2. Copy environment config
cp .env.example .env.local
# Fill in DOWNLOAD_TOKEN_SECRET at minimum (openssl rand -hex 32).
# Paddle values can stay blank for now — see section 4 below.

# 3. Set up the local database (SQLite — zero external setup)
npx prisma migrate dev --name init

# 4. Run the dev server
npm run dev
```

The site will be running at `http://localhost:3000`. The landing page, checkout summary page,
legal pages, and layout all render immediately — no Paddle credentials required to see the site.
**Actually opening a checkout and completing a purchase requires Paddle Sandbox credentials**, see
`PADDLE_SETUP.md`.

### Local product files

`/api/download/[token]` reads product files from `private-assets/` (git-ignored). For local
testing, place your actual `FLUENT-Social-Fluency-System.pdf` and `FLUENT_COMPLETE.zip` files
there.

---

## 3. Development mode vs. Paddle Sandbox mode (section 50)

These are two different things and this project keeps them distinct:

- **Local development mode**: the site runs, every page renders, and `CheckoutButton` /
  `CheckoutStart` will show a clear inline error ("Checkout isn't connected yet…") instead of
  silently failing, if Paddle isn't configured. Nothing here simulates a fake purchase — there is
  no mock "pretend this succeeded" button anywhere in the codebase, by design.
- **Paddle Sandbox mode**: once `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `PADDLE_FLUENT_PRICE_ID`, and
  `PADDLE_COMPLETE_PRICE_ID` are set (from your Paddle **Sandbox** dashboard) and
  `PADDLE_ENV=sandbox` / `NEXT_PUBLIC_PADDLE_ENV=sandbox`, checkout opens a real Paddle Sandbox
  overlay, and Paddle's test card numbers can be used to exercise the full flow end to end,
  including the webhook.

---

## 4. Paddle setup

See **`PADDLE_SETUP.md`** for the complete step-by-step guide, and the checklist at the end of this
conversation for exactly which values are needed from you and where to find them.

Short version:

1. Create a Paddle account, switch to **Sandbox** mode.
2. Create two products (FLUENT, FLUENT COMPLETE), each with one price ($24.99 / $39.99 USD,
   one-time).
3. Create a client-side token (Developer Tools > Authentication).
4. Create a notification destination pointing at
   `https://YOUR-DOMAIN/api/paddle/webhook`, subscribed to `transaction.completed` and
   `transaction.paid`, and copy its secret key.
5. Fill all of the above into `.env.local`.

---

## 5. Webhook testing

Paddle needs a public HTTPS URL to send webhooks to — `localhost` won't work directly. Use a
tunnel during development:

```bash
# using ngrok, or any similar tool
ngrok http 3000
```

Then set your Paddle Sandbox notification destination to
`https://<your-ngrok-subdomain>.ngrok.io/api/paddle/webhook`, and set
`NEXT_PUBLIC_SITE_URL=https://<your-ngrok-subdomain>.ngrok.io` in `.env.local` so links generated
in emails/downloads resolve correctly.

To verify a webhook was received and processed:

```bash
npx prisma studio
# Inspect the WebhookEvent table (processedOk should be true),
# the Order table (paymentStatus should be "paid"),
# and the ProductAccess table (should contain the granted product).
```

Paddle's dashboard also shows delivery attempts and response codes under **Developer Tools >
Notifications > (your destination) > Recent deliveries** — useful for debugging a 401 (bad
signature) or 500 (server error) response.

---

## 6. Email configuration

`lib/email/service.ts` is written against a generic transactional-email interface. Without
`EMAIL_PROVIDER` / `EMAIL_PROVIDER_API_KEY` set, emails are logged to the console instead of sent —
the rest of the fulfillment flow (order creation, access granting) still works normally, so you can
develop without an email provider connected.

Currently implemented: **Resend**. To add Postmark, SendGrid, or another provider, add a case to
the `switch` in `send()` following the same shape as `sendViaResend`.

---

## 7. Download storage

Local dev serves files from `private-assets/` directly off disk. **This is not appropriate for
production** — see `PRODUCTION_CHECKLIST.md` for switching `DOWNLOAD_STORAGE_DRIVER` to `s3` (or
another object store) and implementing signed-URL generation in `lib/download.ts`'s
`resolveDownloadSource`.

---

## 8. Analytics

`lib/analytics.ts` fans a single `trackEvent()` call out to GA4, Meta Pixel, and TikTok Pixel,
whichever have an ID configured. Tracked events: `landing_page_view`, `product_view`,
`checkout_started`, `checkout_completed`, `complete_upsell_viewed`, `complete_upsell_clicked`,
`purchase_completed`, `download_started`. No IDs are required for the site to function — analytics
scripts simply don't load if their env var is empty.

---

## 9. Adding testimonials

`components/Testimonials.tsx` ships with an intentionally empty `TESTIMONIALS` array and renders
nothing until populated — no fabricated quotes, names, or ratings are included anywhere in this
codebase (see master prompt section 20). Add real, permission-cleared entries there when you have
them.

---

## 10. Deployment / production migration

See `PRODUCTION_CHECKLIST.md` for the full list. At a glance, going live means:

- `PADDLE_ENV=production` / `NEXT_PUBLIC_PADDLE_ENV=production`
- A **production** Paddle client token (different from your sandbox one)
- **Production** price IDs (Paddle sandbox and production catalogs are entirely separate — sandbox
  price IDs will not work in production)
- A **new** webhook notification destination pointed at your real domain, with its own secret
- A real database (Postgres/MySQL — SQLite is fine for local dev only)
- A real object store for downloadable files
- A connected transactional email provider
- Legal pages reviewed by an actual lawyer

---

## 11. Testing checklist

The ten test scenarios from the build spec (Paddle checkout success/failure, duplicate webhooks,
access control, email delivery, mobile/desktop checkout, etc.) are listed in
`PRODUCTION_CHECKLIST.md` under **Testing**, with notes on how to exercise each one in Sandbox.
