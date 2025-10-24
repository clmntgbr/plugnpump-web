import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://localhost/api';

async function searchStationsHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const itemsPerPage = searchParams.get('itemsPerPage') || '200';
    const geo_distance = searchParams.get('geo_distance') || 'true';
    const distance = searchParams.get('distance') || '1000';

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const queryParams = new URLSearchParams({
      latitude,
      longitude,
      itemsPerPage,
      geo_distance,
      distance,
    });

    const backendResponse = await fetch(
      `${BACKEND_API_URL}/search/stations?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        ...(process.env.NODE_ENV === 'development' && {
          // @ts-ignore - Node.js specific option
          rejectUnauthorized: false,
        }),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch stations from backend' },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    
    // Return directly the stations array instead of the full response object
    return NextResponse.json(data.results || []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = searchStationsHandler;
