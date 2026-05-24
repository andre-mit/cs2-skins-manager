import { NextRequest, NextResponse } from 'next/server';
import { getStickersFromJson } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get('locale') || 'en';
  const search = request.nextUrl.searchParams.get('search') || '';
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

  let stickers = getStickersFromJson(locale);

  // Filter by search
  if (search.trim()) {
    const lowerSearch = search.toLowerCase();
    stickers = stickers.filter(s => s.name.toLowerCase().includes(lowerSearch));
  }

  const total = stickers.length;
  const paginated = stickers.slice(offset, offset + limit);

  return NextResponse.json({
    stickers: paginated,
    total,
    hasMore: offset + limit < total,
  });
}
