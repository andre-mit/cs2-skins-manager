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

        const host = request.headers.get('x-forwarded-host') || url.host;
        const protocol = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
        const isHttps = protocol === 'https';

        (await cookies()).set('session', token, {
          httpOnly: true,
          secure: isHttps || process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
        });

        const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
        return NextResponse.redirect(`${baseUrl}/`);
      }
    }
  } catch (err) {
    console.error('Error verifying Steam OpenID', err);
  }

  const host = request.headers.get('x-forwarded-host') || url.host;
  const protocol = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
  return NextResponse.redirect(`${baseUrl}/?error=auth_failed`);
}
