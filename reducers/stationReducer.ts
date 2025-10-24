import { StationState, StationSearchParams, Station } from '../types/station';

export type StationAction =
  | { type: 'SEARCH_STATIONS_START'; payload: StationSearchParams }
  | { type: 'SEARCH_STATIONS_SUCCESS'; payload: Station[] }
  | { type: 'SEARCH_STATIONS_ERROR'; payload: string }
  | { type: 'CLEAR_STATIONS' }
  | { type: 'SET_LOADING'; payload: boolean };

export const initialStationState: StationState = {
  stations: [],
  loading: false,
  error: null,
  searchParams: null,
  totalItems: 0,
  currentPage: 1,
  totalPages: 1,
};

export function stationReducer(state: StationState, action: StationAction): StationState {
  switch (action.type) {
    case 'SEARCH_STATIONS_START':
      return {
        ...state,
        loading: true,
        error: null,
        searchParams: action.payload,
      };

    case 'SEARCH_STATIONS_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        stations: action.payload,
        totalItems: action.payload.length,
        currentPage: 1,
        totalPages: 1,
      };

    case 'SEARCH_STATIONS_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        stations: [],
      };

    case 'CLEAR_STATIONS':
      return {
        ...state,
        stations: [],
        error: null,
        totalItems: 0,
        currentPage: 1,
        totalPages: 1,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
}
