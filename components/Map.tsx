'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useStations } from '../contexts/StationContext';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Marker })), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Popup })), { ssr: false });


interface MapProps {
  className?: string;
}

export default function Map({ className = '' }: MapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { searchStations, state } = useStations();

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
        },
        (error) => {
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, [isClient]);


  const handleMapEvent = (event: string, data?: any) => {
    console.log(`🗺️ Map event: ${event}`, data);
    
    // Search for stations when map moves or zooms
    if ((event === 'move' || event === 'zoom') && data?.center) {
      const { lat, lng } = data.center;
      console.log('🔍 Searching stations for location:', { lat, lng });
      
      searchStations({
        latitude: lat,
        longitude: lng,
        itemsPerPage: 200,
        geo_distance: true,
        distance: 1000,
      });
    }
  };

  // Search for stations on initial load
  useEffect(() => {
    if (isClient && !hasSearched) {
      const center = userLocation || [48.8566, 2.3522];
      console.log('🔍 Initial station search for:', center);
      
      searchStations({
        latitude: center[0],
        longitude: center[1],
        itemsPerPage: 200,
        geo_distance: true,
        distance: 1000,
      });
      setHasSearched(true);
    }
  }, [isClient, userLocation, searchStations, hasSearched]);

  if (!isClient) {
    return null;
  }

  const center: [number, number] = userLocation || [48.8566, 2.3522];
  
  console.log('🗺️ Map center:', center, userLocation ? 'User location' : 'Default location');

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
        
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <div className="text-center">
                <h3 className="font-semibold text-red-600">📍 Your Location</h3>
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

        {/* Station markers */}
        {state.stations.map((station) => (
          <Marker 
            key={station.stationId} 
            position={[parseFloat(station.address.latitude), parseFloat(station.address.longitude)]}
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

      </MapContainer>
    </div>
  );
}
