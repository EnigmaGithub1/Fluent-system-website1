// src/lib/customers.ts
//
// Customer record operations (see master prompt section 28). Deliberately
// minimal — email, name, and the Paddle customer id used to reconcile
// against Paddle's own records. No payment data is ever stored here.

import { db } from '@/lib/db';
import type { Customer } from '@prisma/client';

export interface UpsertCustomerInput {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  paddleCustomerId?: string | null;
}

/**
 * Creates a customer if one doesn't exist for this email, or updates
 * their name / Paddle customer id if it does. Email is the natural
 * key — a person buying twice with the same email is the same customer.
 */
export async function upsertCustomer(input: UpsertCustomerInput): Promise<Customer> {
  const email = input.email.trim().toLowerCase();

  return db.customer.upsert({
    where: { email },
    create: {
      email,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      paddleCustomerId: input.paddleCustomerId ?? null,
    },
    update: {
      // Only overwrite fields we actually received something for —
      // don't blank out a name on a webhook event that omits it.
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
      ...(input.paddleCustomerId ? { paddleCustomerId: input.paddleCustomerId } : {}),
    },
  });
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  return db.customer.findUnique({ where: { email: email.trim().toLowerCase() } });
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return db.customer.findUnique({ where: { id } });
}
