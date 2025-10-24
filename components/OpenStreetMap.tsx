"use client";

import { useStations } from "@/contexts/StationContext";
import { Station } from "@/types/station";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

export const OpenStreetMap = () => {
  const [isClient, setIsClient] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [mapHeight, setMapHeight] = useState(0);
  const { searchStations, state } = useStations();
  const [dynamicRadius, setDynamicRadius] = useState(0);
  const [stationIcon, setStationIcon] = useState<any>(null);

  const [center, setCenter] = useState<{ latitude: number; longitude: number }>({
    latitude: 48.8566,
    longitude: 2.3522,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initial search for stations
  useEffect(() => {
    if (isClient && !state.loading && state.stations.length === 0) {
      searchStations({
        latitude: center.latitude,
        longitude: center.longitude,
        itemsPerPage: 200,
        geo_distance: true,
        distance: 5000,
      });
    }
  }, [isClient, center, searchStations, state.loading, state.stations.length]);

  if (!isClient) {
    return <div className="h-96 bg-gray-200 animate-pulse rounded" />;
  }

  const { MapContainer, TileLayer, useMapEvents, Marker, Popup, Circle, useMap } = require("react-leaflet");
  const L = require("leaflet");

  const calculateRadius = (map: any) => {
    const bounds = map.getBounds();
    const latDiff = bounds.getNorth() - bounds.getSouth();
    const heightInMeters = latDiff * 111000;
    return heightInMeters / 2;
  };

  const handleMapMove = (center: { latitude: number; longitude: number }, radius: number) => {
    // Check if center and radius are valid
    if (!center || typeof center.latitude !== 'number' || typeof center.longitude !== 'number') {
      return;
    }
    
    if (typeof radius !== 'number' || radius <= 0) {
      return;
    }
    
    setCenter({ latitude: center.latitude, longitude: center.longitude });
    searchStations({
      latitude: center.latitude,
      longitude: center.longitude,
      itemsPerPage: 200,
      geo_distance: true,
      distance: radius,
    });
  };

  const RadiusDisplay = () => {
    const map = useMap();

    useEffect(() => {
      const updateRadiusInfo = () => {
        const zoom = map.getZoom();
        setCurrentZoom(zoom);

        setMapHeight(calculateRadius(map));

        const newRadius = calculateRadius(map);
        setDynamicRadius(newRadius);
      };

      map.on("zoomend", updateRadiusInfo);
      map.on("moveend", updateRadiusInfo);

      updateRadiusInfo();

      return () => {
        map.off("zoomend", updateRadiusInfo);
        map.off("moveend", updateRadiusInfo);
      };
    }, [map]);

    return null;
  };

  const MapEvents = () => {
    const map = useMapEvents({
      moveend: () => {
        const center = map.getCenter();
        const radius = calculateRadius(map);
        
        // Convert Leaflet center to our format
        handleMapMove({
          latitude: center.lat,
          longitude: center.lng
        }, radius);
      },
    });
    return null;
  };

  var centerCrossIcon = L.divIcon({
    className: "station-marker",
    html: `<div style="
      width: 16px; 
      height: 16px; 
      background:rgb(255, 0, 0); 
      border: 2px solid white; 
      border-radius: 50%; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
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

  return (
    <div className="relative">
      <MapContainer center={{ lat: center.latitude, lng: center.longitude }} zoom={13} style={{ height: "100vh", width: "100%" }} className="z-0">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <Circle
          center={[center.latitude, center.longitude]}
          radius={dynamicRadius}
          pathOptions={{
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.1,
            weight: 2,
          }}
        />

        {state.stations.map((station, index) => {
          return (
            <Marker
              key={index}
              position={[parseFloat(station.address.latitude), parseFloat(station.address.longitude)]}
              icon={stationIconInstance || undefined}
            >
              <Popup>{station.name}</Popup>
            </Marker>
          );
        })}

        <Marker key={"center"} position={[center.latitude, center.longitude]} icon={centerCrossIcon}></Marker>
        <MapEvents />
        <RadiusDisplay />
      </MapContainer>

      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg z-10">
        <div className="text-sm font-medium text-gray-700">
          <div>
            Rayon du cercle: <span className="font-bold text-blue-600">{(dynamicRadius / 1000).toFixed(1)} km</span>
          </div>
          <div>
            Hauteur de la carte: <span className="font-bold text-gray-600">{(mapHeight / 1000).toFixed(1)} km</span>
          </div>
          <div>
            Zoom: <span className="font-bold text-gray-600">{currentZoom}</span>
          </div>
          <div>
            Stations: <span className="font-bold text-green-600">{state.stations.length}</span>
          </div>
          <div>
            Loading: <span className="font-bold text-orange-600">{state.loading ? 'Yes' : 'No'}</span>
          </div>
          {state.error && (
            <div>
              Error: <span className="font-bold text-red-600">{state.error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};