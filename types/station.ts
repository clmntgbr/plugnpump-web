export interface Address {
  streetLine1: string;
  streetLine2: string | null;
  streetLine3: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
}

export interface Station {
  stationId: string;
  name: string;
  services: string[];
  address: Address;
}

export interface StationSearchParams {
  latitude: number;
  longitude: number;
  itemsPerPage?: number;
  geo_distance?: boolean;
  distance?: number;
}

export interface StationState {
  stations: Station[];
  loading: boolean;
  error: string | null;
  searchParams: StationSearchParams | null;
  totalItems: number;
  currentPage: number;
  totalPages: number;
}
