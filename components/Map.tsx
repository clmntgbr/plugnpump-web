'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useStations } from '../contexts/StationContext';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Marker })), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Popup })), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Circle })), { ssr: false });
// Component to capture map instance and update zoom
function MapInstanceCapture({ onMapReady, onZoomChange }: { onMapReady: (map: any) => void; onZoomChange: (zoom: number) => void }) {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
    onZoomChange(map.getZoom());
    
    const handleZoom = () => {
      onZoomChange(map.getZoom());
    };
    
    map.on('zoomend', handleZoom);
    
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, onMapReady, onZoomChange]);

  return null;
}

function MapEventsHandler({ onSearchStations }: { onSearchStations: (lat: number, lng: number, map: any) => void }) {
  const { useMapEvents } = require('react-leaflet');
  
  useMapEvents({
    moveend: (e: any) => {
      const map = e.target;
      const center = map.getCenter();
      onSearchStations(center.lat, center.lng, map);
    },
    zoomend: (e: any) => {
      const map = e.target;
      const center = map.getCenter();
      onSearchStations(center.lat, center.lng, map);
    }
  });

  return null;
}


interface MapProps {
  className?: string;
}

export default function Map({ className = '' }: MapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(0);
  const [searchCenter, setSearchCenter] = useState<[number, number]>([48.8566, 2.3522]);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [currentZoom, setCurrentZoom] = useState(13);
  const { searchStations, state } = useStations();

  // Custom icons - created only on client side
  const [userIcon, setUserIcon] = useState<any>(null);
  const [stationIcon, setStationIcon] = useState<any>(null);

  useEffect(() => {
    if (isClient) {
      const L = require('leaflet');
      
      const userIconInstance = L.divIcon({
        className: "user-marker",
        html: `<div style="
          width: 20px; 
          height: 20px; 
          background: #3b82f6; 
          border: 3px solid white; 
          border-radius: 50%; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const stationIconInstance = L.divIcon({
        className: "station-marker",
        html: `<div style="
          width: 16px; 
          height: 16px; 
          background: #10b981; 
          border: 2px solid white; 
          border-radius: 50%; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      setUserIcon(userIconInstance);
      setStationIcon(stationIconInstance);
    }
  }, [isClient]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          console.log('📍 User location obtained:', { latitude, longitude });
        },
        (error) => {
          const errorType = error.code === 1 ? 'PERMISSION_DENIED' :
                          error.code === 2 ? 'POSITION_UNAVAILABLE' :
                          error.code === 3 ? 'TIMEOUT' : 'UNKNOWN';
          
          console.warn('⚠️ Geolocation failed:', {
            code: error.code,
            message: error.message,
            type: errorType
          });
          // Continue with default location (Paris) - no error blocking
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      console.warn('⚠️ Geolocation is not supported by this browser.');
    }
  }, [isClient]);


  const calculateRadius = (map: any) => {
    const bounds = map.getBounds();
    const latDiff = bounds.getNorth() - bounds.getSouth();
    const heightInMeters = latDiff * 111000;
    return heightInMeters / 2;
  };

  const handleSearchStations = (lat: number, lng: number, map?: any) => {
    console.log('🔍 Searching stations for location:', { lat, lng });
    
    // Always calculate radius from map bounds
    const currentMap = map || mapInstance;
    if (!currentMap) {
      console.warn('⚠️ No map instance available for radius calculation');
      return;
    }
    
    const distance = calculateRadius(currentMap);
    console.log('📏 Calculated search radius:', distance, 'meters');
    
    // Update search circle state
    setSearchCenter([lat, lng]);
    setSearchRadius(Math.round(distance));
    
    console.log('🚀 Calling searchStations API...');
    searchStations({
      latitude: lat,
      longitude: lng,
      itemsPerPage: 200,
      geo_distance: true,
      distance: Math.round(distance),
    });
  };

  // Search for stations when map is ready
  useEffect(() => {
    if (isClient && mapInstance && !hasSearched) {
      // Add a small delay to ensure map is fully loaded
      const timer = setTimeout(() => {
        console.log('🔍 Initial station search for Paris (default)');
        handleSearchStations(48.8566, 2.3522, mapInstance);
        setHasSearched(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isClient, mapInstance, hasSearched]);

  // Search for stations when user location is found
  useEffect(() => {
    if (userLocation && mapInstance && hasSearched) {
      console.log('🔍 User location found, searching at user position');
      handleSearchStations(userLocation[0], userLocation[1], mapInstance);
    }
  }, [userLocation, mapInstance, hasSearched]);

  if (!isClient) {
    return null;
  }

  const center: [number, number] = userLocation || [48.8566, 2.3522];
  
  console.log('🗺️ Map center:', center, userLocation ? 'User location' : 'Default location');
  console.log('📊 Stations state:', { 
    loading: state.loading, 
    error: state.error, 
    count: state.stations.length,
    hasSearched 
  });

  return (
    <div className={`fixed inset-0 z-50 bg-white ${className}`}>
      <MapContainer
        key={userLocation ? `user-location-${userLocation[0]}-${userLocation[1]}` : 'default-paris'}
        center={center}
        zoom={13}
        style={{ height: '100vh', width: '100vw' }}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={true}
        zoomAnimation={true}
        fadeAnimation={true}
        markerZoomAnimation={true}
        
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && userIcon && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold text-blue-600">📍 Your Location</h3>
                <p className="text-sm text-gray-600">
                  Lat: {userLocation[0].toFixed(6)}<br />
                  Lng: {userLocation[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {!userLocation && (
          <Marker position={[48.8566, 2.3522]}>
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold text-blue-600">🗼 Paris, France</h3>
                <p className="text-sm text-gray-600">
                  Default location<br />
                  Lat: 48.8566<br />
                  Lng: 2.3522
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Search radius circle */}
        <Circle
          center={searchCenter}
          radius={searchRadius}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 5'
          }}
        />

        {/* Station markers */}
        {state.stations.map((station) => (
          <Marker 
            key={station.stationId} 
            position={[parseFloat(station.address.latitude), parseFloat(station.address.longitude)]}
            icon={stationIcon || undefined}
          >
            <Popup>
              <div className="text-center min-w-[200px]">
                <h3 className="font-semibold text-green-600 mb-2">⛽ {station.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {station.address.streetLine1}<br />
                  {station.address.postalCode} {station.address.city}
                </p>
                <div className="text-xs text-gray-500">
                  <p className="font-semibold mb-1">Services:</p>
                  <div className="flex flex-wrap gap-1">
                    {station.services.slice(0, 3).map((service, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">
                        {service}
                      </span>
                    ))}
                    {station.services.length > 3 && (
                      <span className="text-gray-400">+{station.services.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Map instance capture */}
        <MapInstanceCapture 
          onMapReady={setMapInstance} 
          onZoomChange={setCurrentZoom}
        />
        
        {/* Map events handler */}
        <MapEventsHandler onSearchStations={handleSearchStations} />
      </MapContainer>

      {/* Radius information overlay */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg z-10">
        <div className="text-sm font-medium text-gray-700">
          <div>
            Rayon de recherche: <span className="font-bold text-blue-600">{(searchRadius / 1000).toFixed(1)} km</span>
          </div>
          <div>
            Zoom: <span className="font-bold text-gray-600">{currentZoom}</span>
          </div>
          <div>
            Stations trouvées: <span className="font-bold text-green-600">{state.stations.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
