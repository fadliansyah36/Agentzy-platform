import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  const lat = latStr !== null ? Number(latStr) : NaN;
  const lng = lngStr !== null ? Number(lngStr) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: 'Koordinat latitude/longitude tidak valid.' },
      { status: 400 }
    );
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';

  if (!apiKey) {
    return NextResponse.json({
      address: null,
      district: null,
      source: 'coordinates_only',
    });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
      `${lat},${lng}`
    )}&language=id&key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({
        address: null,
        district: null,
        source: 'coordinates_only',
      });
    }

    const data = (await res.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        address_components?: Array<{
          long_name: string;
          types: string[];
        }>;
      }>;
    };

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return NextResponse.json({
        address: null,
        district: null,
        source: 'coordinates_only',
      });
    }

    const primary = data.results[0];
    const components = primary.address_components || [];
    const sublocality = components.find(
      (c) =>
        c.types.includes('sublocality_level_1') ||
        c.types.includes('administrative_area_level_3')
    )?.long_name;
    const city = components.find((c) =>
      c.types.includes('administrative_area_level_2')
    )?.long_name;

    const district =
      [sublocality, city].filter(Boolean).join(', ') || null;

    return NextResponse.json({
      address: primary.formatted_address || null,
      district,
      source: 'google_geocoding',
    });
  } catch {
    return NextResponse.json({
      address: null,
      district: null,
      source: 'coordinates_only',
    });
  }
}
