'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { StationState, StationSearchParams } from '../types/station';
import { stationReducer, initialStationState, StationAction } from '../reducers/stationReducer';
import { StationApiService } from '../services/stationApi';

interface StationContextType {
  state: StationState;
  searchStations: (params: StationSearchParams) => Promise<void>;
  clearStations: () => void;
  setLoading: (loading: boolean) => void;
}

const StationContext = createContext<StationContextType | undefined>(undefined);

interface StationProviderProps {
  children: ReactNode;
}

export function StationProvider({ children }: StationProviderProps) {
  const [state, dispatch] = useReducer(stationReducer, initialStationState);

  const searchStations = useCallback(async (params: StationSearchParams) => {
    try {
      dispatch({ type: 'SEARCH_STATIONS_START', payload: params });
      const response = await StationApiService.searchStations(params);
      dispatch({ type: 'SEARCH_STATIONS_SUCCESS', payload: response });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch({ type: 'SEARCH_STATIONS_ERROR', payload: errorMessage });
    }
  }, []);

  const clearStations = useCallback(() => {
    dispatch({ type: 'CLEAR_STATIONS' });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const value: StationContextType = {
    state,
    searchStations,
    clearStations,
    setLoading,
  };

  return (
    <StationContext.Provider value={value}>
      {children}
    </StationContext.Provider>
  );
}

export function useStations() {
  const context = useContext(StationContext);
  if (context === undefined) {
    throw new Error('useStations must be used within a StationProvider');
  }
  return context;
}
