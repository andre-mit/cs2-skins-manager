import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-jwt-key-change-me');

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const params = new URLSearchParams();
  params.set('openid.assoc_handle', searchParams.get('openid.assoc_handle') || '');
  params.set('openid.signed', searchParams.get('openid.signed') || '');
  params.set('openid.sig', searchParams.get('openid.sig') || '');
  params.set('openid.ns', 'http://specs.openid.net/auth/2.0');
  params.set('openid.mode', 'check_authentication');

  const signed = searchParams.get('openid.signed')?.split(',') || [];
  for (const field of signed) {
    params.set(`openid.${field}`, searchParams.get(`openid.${field}`) || '');
  }

  try {
    const res = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const body = await res.text();
    const isValid = body.includes('is_valid:true');

    if (isValid) {
      const claimedId = searchParams.get('openid.claimed_id');
      const steamId = claimedId?.split('/').pop();

      if (steamId) {
        // Create JWT
        const token = await new SignJWT({ steamId })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('30d')
          .sign(JWT_SECRET);

        (await cookies()).set('session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
        });

        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  } catch (err) {
    console.error('Error verifying Steam OpenID', err);
  }

  return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
}
