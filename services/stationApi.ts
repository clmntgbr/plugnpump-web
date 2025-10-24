import { StationSearchParams, Station } from '../types/station';

const API_BASE_URL = '/api';

export class StationApiService {
  private static buildSearchUrl(params: StationSearchParams): string {
    const searchParams = new URLSearchParams();
    
    searchParams.append('latitude', params.latitude.toString());
    searchParams.append('longitude', params.longitude.toString());
    searchParams.append('itemsPerPage', (params.itemsPerPage || 200).toString());
    searchParams.append('geo_distance', (params.geo_distance !== false).toString());
    searchParams.append('distance', (params.distance || 10000).toString());

    return `${API_BASE_URL}/search/stations?${searchParams.toString()}`;
  }

  static async searchStations(params: StationSearchParams): Promise<Station[]> {
    try {
      const url = this.buildSearchUrl(params);
      console.log('🔍 Searching stations:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Station[] = await response.json();
      console.log('✅ Stations found:', data.length, 'stations');
      
      return data;
    } catch (error) {
      console.error('❌ Error searching stations:', error);
      throw error;
    }
  }
}
