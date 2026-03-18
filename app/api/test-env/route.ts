import { NextResponse } from 'next/server';

export async function GET() {
  // Only grab keys that might help us debug without leaking sensitive tokens
  const keys = Object.keys(process.env).filter(
    k => k.includes('URL') || k.includes('DATA') || k.includes('DB') || k.includes('POSTGRES') || k.includes('SUPA')
  );

  return NextResponse.json({
    status: 'Environment variable debug',
    DATABASE_URL_exists: !!process.env.DATABASE_URL,
    DIRECT_URL_exists: !!process.env.DIRECT_URL,
    suspect_keys: keys,
  });
}
