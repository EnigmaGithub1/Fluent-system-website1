// src/app/api/download/[token]/route.ts
//
// Serves the actual product file, but only after verifying a signed,
// expiring download token (see lib/download.ts). This is what keeps
// the real asset off any guessable public URL (master prompt section 30).

import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { verifyDownloadToken, resolveDownloadSource, DownloadTokenError } from '@/lib/download';
import { getProduct } from '@/lib/products';

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  let payload;
  try {
    payload = await verifyDownloadToken(params.token);
  } catch (err) {
    const message = err instanceof DownloadTokenError ? err.message : 'Invalid or expired download link.';
    // Customer-friendly error page, not a raw stack trace (section 54).
    return NextResponse.json(
      { error: message, action: 'Request a fresh link at /download using your purchase email.' },
      { status: 410 }
    );
  }

  const source = await resolveDownloadSource(payload.internalProductId);
  const product = getProduct(payload.internalProductId);

  if (source.driver === 's3') {
    // Production extension point: generate & redirect to a signed S3/R2
    // URL here instead of streaming through the Next.js server. Left
    // unimplemented rather than guessing your bucket/CDN setup — see
    // PRODUCTION_CHECKLIST.md.
    return NextResponse.json(
      { error: 'S3 download driver is not yet implemented in this environment.' },
      { status: 501 }
    );
  }

  try {
    const filePath = path.join(process.cwd(), 'private-assets', product.downloadPackage);
    const file = await readFile(filePath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${product.downloadPackage}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[download] file read failed', err);
    return NextResponse.json(
      {
        error: 'Your purchase is valid, but the file could not be located on the server.',
        action: `Contact ${process.env.SUPPORT_EMAIL} and we'll sort it out.`,
      },
      { status: 500 }
    );
  }
}
