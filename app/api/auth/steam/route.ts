import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const returnTo = `${baseUrl}/api/auth/steam/return`;

  const steamOpenIdUrl = new URL('https://steamcommunity.com/openid/login');
  steamOpenIdUrl.searchParams.set('openid.ns', 'http://specs.openid.net/auth/2.0');
  steamOpenIdUrl.searchParams.set('openid.mode', 'checkid_setup');
  steamOpenIdUrl.searchParams.set('openid.return_to', returnTo);
  steamOpenIdUrl.searchParams.set('openid.realm', baseUrl);
  steamOpenIdUrl.searchParams.set('openid.identity', 'http://specs.openid.net/auth/2.0/identifier_select');
  steamOpenIdUrl.searchParams.set('openid.claimed_id', 'http://specs.openid.net/auth/2.0/identifier_select');

  return NextResponse.redirect(steamOpenIdUrl.toString());
}
