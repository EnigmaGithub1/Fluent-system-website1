# Paddle Setup Guide

Exact, step-by-step instructions for connecting this website to Paddle, starting with **Sandbox**.
Dashboard navigation labels are current as of this writing (Aug 2026) — Paddle occasionally renames
sections, so if something doesn't match exactly, look for the nearest equivalent under **Developer
Tools**.

---

## Step 0 — Create your Paddle account and switch to Sandbox

1. Sign up at [paddle.com](https://www.paddle.com) if you haven't already.
2. In the dashboard, find the **Sandbox / Live** environment switcher (top of the sidebar) and
   make sure you're in **Sandbox**. Everything below happens in Sandbox first — do not touch Live
   settings yet.

---

## Step 1 — Create your two products and prices

Paddle separates **Products** (the thing you're selling) from **Prices** (what it costs). A
checkout is opened against a **Price ID**, not a Product ID — this is why the app's configuration
asks for price IDs specifically.

1. Go to **Catalog > Products**.
2. Click **Add product**.
   - Name: `FLUENT`
   - Tax category: choose the closest fit (e.g. "Standard digital goods" / "eBook" — whichever
     Paddle's current category list offers for downloadable digital products).
3. On the FLUENT product page, click **Add price**.
   - Amount: `24.99`
   - Currency: `USD`
   - Billing type: **One-time** (not recurring)
4. Repeat steps 2–3 for a second product:
   - Name: `FLUENT COMPLETE`
   - Price: `39.99 USD`, one-time.
5. Open each price's detail page and copy its **Price ID** — it looks like
   `pri_01h1vjfevh5etwq3rb416a23h2`. You'll need both.

---

## Step 2 — Get your client-side token

1. Go to **Developer Tools > Authentication**.
2. Under **Client-side tokens**, create one (or use the default Sandbox one if already present).
3. Copy the token — it looks like `test_7d279f61a3499fed520f7cd8c08`.

This token is **designed by Paddle to be exposed in the browser** — it can only open checkouts, not
read or modify your account. It's safe to put in `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`.

---

## Step 3 — (Optional but recommended) Get a server-side API key

Only needed if you want the app's optional server-to-server reconciliation calls
(`lib/paddle/server.ts`) to work — not required for basic checkout + webhook fulfillment to
function.

1. Go to **Developer Tools > Authentication**.
2. Under **API keys**, click **Generate API key**. Give it a descriptive name (e.g.
   "fluent-website-sandbox").
3. Copy the key immediately — Paddle only shows it once.

This is a **server secret**. It goes in `PADDLE_API_KEY`, never in a `NEXT_PUBLIC_` variable.

---

## Step 4 — Set up your webhook (notification destination)

1. Go to **Developer Tools > Notifications**.
2. Click **Add destination** (sometimes labeled "New notification destination").
3. **URL**: `https://YOUR-DOMAIN/api/paddle/webhook`
   - For local development, this needs to be a public HTTPS URL — use a tunnel like `ngrok`
     (`ngrok http 3000`, then use the `https://*.ngrok.io/api/paddle/webhook` URL it gives you).
   - `localhost` URLs will NOT work — Paddle's servers need to reach yours over the public internet.
4. **Events to subscribe to**: at minimum, select:
   - `transaction.completed`
   - `transaction.paid`
   (This app intentionally ignores subscription-related events since both products are one-time
   purchases — no need to subscribe to those.)
5. Save the destination, then open it again and copy its **Secret key** — this is unique to this
   specific destination. If you create another destination later (e.g. for production), it will
   have a *different* secret.

This secret goes in `PADDLE_WEBHOOK_SECRET`.

---

## Step 5 — Fill in your `.env.local`

```bash
PADDLE_ENV=sandbox
NEXT_PUBLIC_PADDLE_ENV=sandbox

NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxxxxxxxxxxxxxxxxxxxxxxx
PADDLE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx          # optional, see Step 3

PADDLE_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

PADDLE_FLUENT_PRICE_ID=pri_xxxxxxxxxxxxxxxxxxxx
PADDLE_COMPLETE_PRICE_ID=pri_xxxxxxxxxxxxxxxxxxxx

NEXT_PUBLIC_SITE_URL=https://<your-ngrok-subdomain>.ngrok.io   # or http://localhost:3000 if not testing webhooks yet
```

Restart `npm run dev` after editing `.env.local` — Next.js only reads environment files on startup.

> **A note on ID formats, since this trips people up:** Paddle prefixes every resource type
> differently, and it's easy to copy the wrong one:
> - Product ID: `pro_...` — this is NOT what checkout needs.
> - Price ID: `pri_...` — this IS what `PADDLE_FLUENT_PRICE_ID` / `PADDLE_COMPLETE_PRICE_ID` need.
>   Find it by opening the product, then looking at its **Prices** list — click into the specific
>   price, not the product itself.
> - Notification destination ID: `ntfset_...` — this is NOT the webhook secret.
> - Notification destination **secret key**: `pdl_ntfset_...` (longer, with a random suffix after
>   the ID portion) — this IS what `PADDLE_WEBHOOK_SECRET` needs. Find it by opening
>   **Developer Tools → Notifications**, clicking the **⋯** menu next to your destination, choosing
>   **Edit destination**, and copying the **Secret key** field shown there (it's read-only, but
>   copyable).

---

## Step 6 — Test a Sandbox purchase

1. Go to the site, click **Get FLUENT**.
2. Paddle's overlay checkout should open. Use one of
   [Paddle's documented Sandbox test card numbers](https://developer.paddle.com/concepts/payment-methods/credit-debit-card)
   (e.g. `4242 4242 4242 4242`, any future expiry, any CVC — confirm the current test card list in
   Paddle's docs, as these can change).
3. Complete the checkout.
4. You should land on `/thank-you`, which will briefly show "Confirming your payment…" and then
   flip to the confirmed state once the webhook lands (usually 1-3 seconds).
5. Verify in your database (`npx prisma studio`):
   - A `WebhookEvent` row with `processedOk = true`
   - An `Order` row with `paymentStatus = "paid"`
   - A `ProductAccess` row granting `fluent`
6. Check your terminal logs (or your email provider's dashboard, once connected) for the purchase
   confirmation email.
7. Click **Access Your Download** and confirm the file downloads.

Repeat for FLUENT COMPLETE, and then test buying FLUENT first and COMPLETE second with the *same*
email to confirm the upgrade path grants both.

---

## Step 7 — Two ways to verify webhook signatures (pick one)

This project verifies signatures manually in `lib/paddle/webhook.ts` using Node's built-in
`crypto` module — zero extra dependencies, and matches the algorithm Paddle documents exactly
(HMAC-SHA256 over `${timestamp}:${rawBody}`, compared against the `h1` value in the
`Paddle-Signature` header).

If you'd rather depend on Paddle's own maintained SDK instead:

```bash
npm install @paddle/paddle-node-sdk
```

```ts
import { Paddle, EventName } from '@paddle/paddle-node-sdk';
const paddle = new Paddle(process.env.PADDLE_API_KEY!);
const event = await paddle.webhooks.unmarshal(rawBody, process.env.PADDLE_WEBHOOK_SECRET!, signature);
```

Both approaches verify the same thing; the manual version in this repo has no dependency risk, the
SDK version gets you Paddle's typed event objects for free. Swap freely.

---

## Moving from Sandbox to Production

See `PRODUCTION_CHECKLIST.md` — in short, every ID above needs to be regenerated from your **Live**
Paddle dashboard (sandbox and production catalogs, tokens, and API keys are entirely separate and
not interchangeable), and you'll create a *second* webhook notification destination pointed at your
real production domain.
