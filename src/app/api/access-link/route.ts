// src/app/api/access-link/route.ts
//
// Backs the "lost your download link?" flow on /download. A customer
// enters the email they purchased with; if it matches a paid order, we
// issue a fresh download token and email it. Deliberately returns the
// same response whether or not the email matches anything, so this
// endpoint can't be used to enumerate customer emails.

import { NextResponse } from 'next/server';
import { getCustomerByEmail } from '@/lib/customers';
import { getOrdersForCustomer } from '@/lib/orders';
import { getCustomerAccess } from '@/lib/access';
import { issueDownloadToken } from '@/lib/download';
import { sendDownloadReminder } from '@/lib/email/service';
import { getProduct, type InternalProductId } from '@/lib/products';

const GENERIC_RESPONSE = {
  message: "If that email has a purchase on file, we've sent a fresh access link to it.",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const customer = await getCustomerByEmail(email);
  if (!customer) {
    // Same response as success — do not reveal whether the email exists.
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const [orders, access] = await Promise.all([
    getOrdersForCustomer(customer.id),
    getCustomerAccess(customer.id),
  ]);

  if (orders.length === 0 || access.length === 0) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  // Send one link per distinct product they own (covers the case where
  // they bought FLUENT, then separately bought COMPLETE).
  for (const productId of access as InternalProductId[]) {
    const { token } = await issueDownloadToken(customer.id, productId);
    const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/download/${token}`;
    const product = getProduct(productId);
    const latestOrder = orders.find((o) => o.internalProductId === productId) ?? orders[0];
    await sendDownloadReminder({ ...latestOrder, productName: product.name }, downloadUrl);
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
