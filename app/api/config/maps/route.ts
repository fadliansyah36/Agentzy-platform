import { NextResponse } from 'next/server';

export async function GET() {
  // This endpoint is consumed by browser map components. Only expose the
  // explicitly public, browser-restricted Maps key; never fall back to the
  // server-only GOOGLE_MAPS_API_KEY secret.
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return NextResponse.json({
    apiKey,
    hasKey: Boolean(apiKey),
  });
}
