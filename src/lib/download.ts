// src/lib/download.ts
//
// Secure download access (see master prompt section 30). Product files
// are never served from a guessable public URL. Instead we issue
// signed, expiring tokens tied to a specific customer + product, and
// verify them server-side on every download request.
//
// Token format: `<payload_base64url>.<hmac_hex>`
// payload = { customerId, internalProductId, exp }
//
// This is a deliberately small hand-rolled scheme (HMAC-signed, not
// encrypted — the payload isn't secret, just tamper-proof) so the
// project doesn't need a JWT dependency. Swap for a JWT library if
// you prefer; the interface (issueDownloadToken / verifyDownloadToken)
// would stay the same.

import { createHmac, timingSafeEqual, randomUUID } from 'crypto';
import { db } from '@/lib/db';
import type { InternalProductId } from '@/lib/products';

function getSecret(): string {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      'DOWNLOAD_TOKEN_SECRET is not set. Generate one with `openssl rand -hex 32` and add it to .env.local.'
    );
  }
  return secret;
}

interface TokenPayload {
  customerId: string;
  internalProductId: InternalProductId;
  exp: number; // unix seconds
  jti: string; // unique id, also stored in DownloadToken table for revocation
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(payloadB64: string): string {
  return createHmac('sha256', getSecret()).update(payloadB64).digest('hex');
}

export interface IssueTokenResult {
  token: string;
  expiresAt: Date;
}

/**
 * Issues a new download token for a customer + product they've been
 * verified (via access.ts) to own. Also records the token in the DB
 * so it can be looked up / revoked / rate-limited if needed.
 */
export async function issueDownloadToken(
  customerId: string,
  internalProductId: InternalProductId
): Promise<IssueTokenResult> {
  const ttlHours = Number(process.env.DOWNLOAD_LINK_TTL_HOURS || 72);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  const payload: TokenPayload = {
    customerId,
    internalProductId,
    exp: Math.floor(expiresAt.getTime() / 1000),
    jti: randomUUID(),
  };

  const payloadB64 = base64url(JSON.stringify(payload));
  const signature = sign(payloadB64);
  const token = `${payloadB64}.${signature}`;

  await db.downloadToken.create({
    data: {
      token,
      customerId,
      internalProductId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export class DownloadTokenError extends Error {}

/**
 * Verifies a token's signature and expiry, and confirms it's still
 * recognized in the database (allows for future revocation). Returns
 * the decoded payload on success.
 */
export async function verifyDownloadToken(token: string): Promise<TokenPayload> {
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) throw new DownloadTokenError('Malformed token.');

  const expected = sign(payloadB64);
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    throw new DownloadTokenError('Invalid signature.');
  }

  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as TokenPayload;

  if (Math.floor(Date.now() / 1000) > payload.exp) {
    throw new DownloadTokenError('Token has expired. Request a fresh link from /download.');
  }

  const record = await db.downloadToken.findUnique({ where: { token } });
  if (!record) throw new DownloadTokenError('Token not recognized (may have been revoked).');

  await db.downloadToken.update({ where: { token }, data: { usedCount: { increment: 1 } } });

  return payload;
}

/**
 * Resolves a verified product id to an actual file location.
 *
 * Local dev: serves from /private-assets (NOT web-accessible directly —
 * only this function reads from it, and it is git-ignored).
 * Production: swap this for a signed S3/R2/GCS URL — see
 * PRODUCTION_CHECKLIST.md for the exact change required.
 */
export async function resolveDownloadSource(internalProductId: InternalProductId): Promise<{
  driver: 'local' | 's3';
  path: string;
}> {
  const driver = process.env.DOWNLOAD_STORAGE_DRIVER === 's3' ? 's3' : 'local';
  const { getProduct } = await import('@/lib/products');
  const filename = getProduct(internalProductId).downloadPackage;

  if (driver === 'local') {
    return { driver, path: `private-assets/${filename}` };
  }

  // Production S3 path — actual signed-URL generation lives wherever
  // your object storage SDK is configured; left as a clear extension
  // point rather than guessing your bucket layout.
  return { driver, path: filename };
}
